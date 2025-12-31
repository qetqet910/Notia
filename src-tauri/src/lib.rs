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

#[derive(Debug, Serialize, Deserialize)]
pub struct Reminder {
    pub completed: bool,
    pub updated_at: Option<String>,
    pub reminder_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub reminders: Option<Vec<Reminder>>,
}

#[derive(Serialize)]
struct Stats {
    totalNotes: usize,
    totalReminders: usize,
    completedReminders: usize,
    completionRate: f64,
    tagsUsed: usize,
}

#[derive(Serialize)]
struct ActivityData {
    date: String,
    count: usize,
    level: usize,
}

#[derive(Serialize)]
struct ActivityResult {
    stats: Stats,
    activityData: Vec<ActivityData>,
}

#[tauri::command]
fn calculate_activity(notes: Vec<Note>) -> ActivityResult {
    let mut data = HashMap::new();
    let mut total_notes = 0;
    let mut total_reminders = 0;
    let mut completed_reminders = 0;
    let mut tags = HashSet::new();

    for note in &notes {
        total_notes += 1;
        if let Some(note_tags) = &note.tags {
            for tag in note_tags {
                tags.insert(tag);
            }
        }
        
        if let Some(reminders) = &note.reminders {
            for r in reminders {
                total_reminders += 1;
                if r.completed {
                    completed_reminders += 1;
                    let date_source = r.updated_at.as_ref().or(r.reminder_time.as_ref());
                    if let Some(date_str) = date_source {
                         // Try parsing with timezone first, then fallback to naive
                         if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
                             let date_key = dt.format("%Y-%m-%d").to_string();
                             *data.entry(date_key).or_insert(0) += 1;
                         } else if let Ok(dt) = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S") {
                             let date_key = dt.format("%Y-%m-%d").to_string();
                             *data.entry(date_key).or_insert(0) += 1;
                         }
                    }
                }
            }
        }
    }

    let completion_rate = if total_reminders > 0 {
        (completed_reminders as f64 / total_reminders as f64) * 100.0
    } else {
        0.0
    };

    let mut sorted_data: Vec<(String, usize)> = data.into_iter().collect();
    sorted_data.sort_by(|a, b| a.0.cmp(&b.0));

    let activity_data = sorted_data.into_iter().map(|(date, count)| {
        ActivityData {
            date,
            count,
            level: (count as f64 / 2.0).ceil().min(4.0) as usize,
        }
    }).collect();

    ActivityResult {
        stats: Stats {
            totalNotes: total_notes,
            totalReminders: total_reminders,
            completedReminders: completed_reminders,
            completionRate: completion_rate,
            tagsUsed: tags.len(),
        },
        activityData: activity_data,
    }
}

#[tauri::command]
fn search_notes(notes: Vec<Note>, query: String) -> Vec<String> {
    let query = query.to_lowercase();
    notes.into_iter()
        .filter(|note| {
            note.title.to_lowercase().contains(&query) ||
            note.content.as_ref().map_or(false, |c| c.to_lowercase().contains(&query))
        })
        .map(|note| note.id)
        .collect()
}

#[tauri::command]
fn optimize_image(img_data: String) -> Result<String, String> {
    let (header, b64_data) = if let Some(idx) = img_data.find(',') {
        (&img_data[..idx+1], &img_data[idx+1..])
    } else {
        ("", img_data.as_str())
    };

    let decoded = general_purpose::STANDARD.decode(b64_data).map_err(|e| e.to_string())?;
    
    let img = image::load_from_memory(&decoded).map_err(|e| e.to_string())?;
    
    // Resize if too large (e.g., > 1200px width)
    let img = if img.width() > 1200 {
        img.resize(1200, 1200, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };

    let mut buffer = Cursor::new(Vec::new());
    // Convert to WebP for optimization if possible, or keep PNG/JPEG
    // Here we enforce PNG for safety and transparency support
    img.write_to(&mut buffer, ImageFormat::Png).map_err(|e| e.to_string())?;
    
    let encoded = general_purpose::STANDARD.encode(buffer.into_inner());
    
    // Ensure we return a valid Data URL
    if !header.is_empty() {
        // Force PNG header since we converted to PNG
        Ok(format!("data:image/png;base64,{}", encoded))
    } else {
        Ok(encoded)
    }
}

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
