# Lottie 애니메이션 ImageData 오류 해결 기록

## 문제 현상

`Login.tsx` 페이지에서 `dotlottie-player`를 사용하여 Lottie 애니메이션을 렌더링할 때, 다음과 같은 `IndexSizeError`가 간헐적으로 발생했습니다.

```
IndexSizeError: Failed to construct 'ImageData': The input data length is not a multiple of (4 * width).
```

이 오류는 애니메이션 라이브러리가 렌더링할 캔버스(canvas)의 크기를 계산하는 시점과, React 및 CSS에 의해 실제 컨테이너의 크기가 확정되는 시점이 일치하지 않아 발생하는 레이스 컨디션(Race Condition)이 원인입니다.

라이브러리가 렌더링을 시작할 때 컨테이너의 높이가 아직 계산되지 않아 `0` 또는 잘못된 값으로 인식했고, 이 크기를 기준으로 `ImageData`를 생성하려다 데이터 불일치로 인해 오류가 발생한 것입니다.

## 해결 과정

1.  **`width` 및 `height` 명시적 설정**: `width="100%"` `height="100%"` 속성을 추가했으나, 부모 컨테이너의 크기 자체가 유동적이라 문제 해결에 실패했습니다.
2.  **CSS `transform` 제거**: 시각적 크기와 실제 DOM 크기 간의 불일치를 유발할 수 있는 `transform scale-150` 클래스를 제거했으나, 근본적인 타이밍 문제가 해결되지 않았습니다.
3.  **`aspect-ratio` 사용**: 컨테이너의 크기를 안정적으로 고정하기 위해 `aspect-square` 클래스를 사용했지만, `framer-motion`과의 상호작용으로 인해 여전히 렌더링 시점의 크기 계산 오류가 발생했습니다.
4.  **`framer-motion` 격리**: `motion.div`를 일반 `div`로 변경하여 `framer-motion`의 영향을 제거했지만, 페이지 전체의 렌더링 과정에서 발생하는 근본적인 타이밍 문제는 여전했습니다.

## 최종 해결책

레이아웃이 완전히 계산되어 안정화된 후에 애니메이션을 재생하도록 의도적으로 지연시키는 방법을 사용했습니다.

`AnimationSection` 컴포넌트 내부에 `useState`와 `useEffect`를 사용하여, 컴포넌트가 마운트되고 100ms 후에 `play` 상태를 `true`로 변경하도록 구현했습니다. `DotLottieReact` 컴포넌트의 `autoplay` 속성은 이 `play` 상태에 바인딩됩니다.

```tsx
const AnimationSection = React.memo(() => {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    // 100ms 지연을 주어 브라우저가 레이아웃 계산을 마칠 시간을 확보합니다.
    const timer = setTimeout(() => setPlay(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    // ... (생략)
          <DotLottieReact
            src={loginAnimation}
            loop
            autoplay={play} // play 상태에 따라 자동 재생 여부 결정
            className="drop-shadow-xl w-full h-full"
          />
    // ... (생략)
  );
});
```

이 방법을 통해 브라우저가 레이아웃 계산을 마칠 충분한 시간을 확보하게 되어, `dotlottie-player`는 항상 정확한 크기의 컨테이너에서 렌더링을 시작할 수 있게 되었고, `ImageData` 오류가 완전히 해결되었습니다.
