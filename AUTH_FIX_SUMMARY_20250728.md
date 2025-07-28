# 인증 시스템 오류 해결 과정 요약 (2025-07-28)

## 1. 최초 문제 발생

- **현상:** 신규 이메일 또는 익명 키 생성 후, 해당 키로 로그인을 시도하면 `유효하지 않은 키입니다` 라는 오류가 발생하며 실패.
- **콘솔 오류:**
  - `POST /auth/v1/token?grant_type=password 400 (Bad Request)`: 클라이언트가 잘못된 이메일/비밀번호로 로그인을 시도함.
  - `POST /functions/v1/create_email_user 500 (Internal Server Error)`: 키 생성 단계에서 Edge Function 내부 오류 발생.

## 2. 원인 분석 및 잘못된 시도들

문제 해결 과정에서 여러 잘못된 가설을 세우고 수정하는 과정이 반복되었습니다.

### 가설 1: 클라이언트 측의 복잡한 비밀번호 처리 로직 문제

- **시도:** 클라이언트(`authStore.ts`)의 로그인 로직을 단순화하고, `-notia-key`와 같은 접미사 규칙을 제거.
- **결과:** 익명 로그인은 되지만, 실제 이메일로 가입한 사용자의 로그인이 불가능해지는 더 큰 문제 발생.

### 가설 2: Edge Function 배포 설정 또는 코드 오류

- **시도:**
  - `cors.ts` 공유 파일 누락으로 추정하고 함수 내에 CORS 헤더를 직접 포함.
  - `creation_attempts` 테이블의 컬럼명을 `ip_address`로 잘못 추정하고 `client_ip`로 수정.
  - `creation_attempts` 테이블에 존재하지 않는 `user_id`를 삽입하려는 코드 수정.
  - `createUser`의 반환값을 불안전하게 구조 분해 할당하여 발생하는 `TypeError`를 수정.
- **결과:** 위의 모든 시도에도 불구하고 `500 Internal Server Error`가 계속 발생. 이는 근본 원인이 다른 곳에 있음을 시사.

## 3. 진짜 근본 원인: 데이터베이스 정합성 문제

모든 시도가 실패한 후, "auth.users와 public.users는 외래키로 연결되어 있다"는 힌트를 통해 문제의 핵심 원인을 파악했습니다.

- **원인:** **데이터베이스 복제 지연(Replication Lag)으로 인한 외래 키 제약 조건 위반.**
  1. Edge Function이 `auth.users` 테이블에 사용자를 `INSERT`한다.
  2. **아주 짧은 지연 시간**으로 인해, `public.users` 테이블은 아직 새로 생성된 `auth.users`의 `id`를 인식하지 못한다.
  3. Edge Function이 이어서 `public.users` 테이블에 프로필을 `INSERT`하려고 시도한다.
  4. `public.users`는 존재하지 않는 `id`를 참조하는 것으로 간주하여 **외래 키 제약 조건 위반(Foreign Key Constraint Violation)** 오류를 발생시킨다.
  5. 이 데이터베이스 오류가 처리되지 못하고 Edge Function을 중단시켜 `500 Internal Server Error`를 반환했다.

## 4. 최종 해결책: 데이터베이스 트리거 도입

애플리케이션 코드 레벨에서 데이터 정합성을 맞추려는 시도를 중단하고, 데이터베이스가 직접 처리하도록 하여 문제를 근본적으로 해결했습니다.

### 1. 데이터베이스 트리거 함수 생성

`auth.users`에 새로운 레코드가 추가되면, 자동으로 `public.users`에 프로필을 생성하는 PostgreSQL 함수를 만들었습니다.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, key)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'key'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. 트리거 연결

생성된 함수를 `auth.users` 테이블의 `INSERT` 이벤트에 연결했습니다.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Edge Function 로직 대폭 단순화

이제 프로필 생성은 데이터베이스가 책임지므로, Edge Function의 코드는 매우 간단해졌습니다. 오직 `auth.users`에 사용자를 생성하고, 필요한 메타데이터(`key`, `display_name`)를 넘겨주는 역할만 수행합니다.

**`create_email_user` 최종 코드:**
```typescript
// ...
serve(async (req) => {
  // ...
  const { email, key } = await req.json();
  // ...

  // createUser의 meta_data를 사용하여 트리거에 key와 display_name 전달
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: key,
    email_confirm: true,
    user_metadata: {
      key: key,
      display_name: email.split('@')[0]
    }
  });

  // ... 성공 또는 실패 응답 반환
});
```

## 5. 결론

이번 오류는 애플리케이션 로직으로 데이터베이스의 정합성을 보장하려 할 때 발생할 수 있는 전형적인 문제였습니다. **데이터베이스 트리거**를 도입하여 데이터 생성 책임을 데이터베이스 자체로 위임함으로써, 문제를 안정적이고 확실하게 해결하고 코드의 복잡성을 크게 낮출 수 있었습니다.
