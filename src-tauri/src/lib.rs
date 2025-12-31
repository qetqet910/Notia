use tauri::Manager;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use chrono::prelude::*;
use image::ImageFormat;
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

// ... (기존 구조체들 생략) ...

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::default().build())
    .plugin(tauri_plugin_process::init())
    .plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
    )
    .invoke_handler(tauri::generate_handler![
        calculate_activity, 
        search_notes,
        optimize_image
    ])
    .setup(|app| {
      // 트레이 메뉴 생성
      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let show_i = MenuItem::with_id(app, "show", "Open Notia", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

      // 트레이 아이콘 생성
      let _tray = TrayIconBuilder::new()
          .icon(app.default_window_icon().unwrap().clone())
          .menu(&menu)
          .show_menu_on_left_click(false)
          .on_menu_event(|app, event| match event.id().as_ref() {
              "quit" => {
                  app.exit(0);
              }
              "show" => {
                  if let Some(window) = app.get_webview_window("main") {
                      let _ = window.show();
                      let _ = window.set_focus();
                  }
              }
              _ => {}
          })
          .on_tray_icon_event(|tray, event| match event {
              TrayIconEvent::Click {
                  button: tauri::tray::MouseButton::Left,
                  ..
              } => {
                  let app = tray.app_handle();
                  if let Some(window) = app.get_webview_window("main") {
                       let _ = window.show();
                       let _ = window.set_focus();
                  }
              }
              _ => {}
          })
          .build(app)?;

      #[cfg(desktop)]
      if let Some(window) = app.get_webview_window("main") {
        // window.open_devtools(); // 기존 코드 유지
        
        // 창 닫기 이벤트 가로채기 (숨기기 모드)
        let window_clone = window.clone();
        window.on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window_clone.hide().unwrap();
            }
            _ => {}
        });
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_dummy_note(
        id: &str, 
        title: &str, 
        content: Option<&str>, 
        tags: Option<Vec<&str>>,
        reminders: Option<Vec<Reminder>>
    ) -> Note {
        Note {
            id: id.to_string(),
            title: title.to_string(),
            content: content.map(|s| s.to_string()),
            tags: tags.map(|v| v.into_iter().map(|s| s.to_string()).collect()),
            reminders,
        }
    }

    fn create_dummy_reminder(
        completed: bool, 
        updated_at: Option<&str>, 
        reminder_time: Option<&str>
    ) -> Reminder {
        Reminder {
            completed,
            updated_at: updated_at.map(|s| s.to_string()),
            reminder_time: reminder_time.map(|s| s.to_string()),
        }
    }

    #[test]
    fn test_calculate_activity() {
        let notes = vec![
            create_dummy_note("1", "Note 1", Some("Content"), Some(vec!["tag1"]), 
                Some(vec![create_dummy_reminder(true, Some("2023-10-27T10:00:00Z"), None)]))
        ];
        let result = calculate_activity(notes);
        assert_eq!(result.stats.totalNotes, 1);
    }

    #[test]
    fn test_search_notes() {
        let notes = vec![create_dummy_note("1", "Alice", None, None, None)];
        let res = search_notes(notes, "Alice".to_string());
        assert_eq!(res, vec!["1"]);
    }
}