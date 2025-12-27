use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use chrono::prelude::*;
use image::ImageFormat;
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Deserialize, Clone)]
pub struct Reminder {
    pub completed: bool,
    pub updated_at: Option<String>,
    pub reminder_time: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub reminders: Option<Vec<Reminder>>,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct ActivityData {
    pub date: String,
    pub count: i32,
    pub level: i32,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct Stats {
    pub totalNotes: i32,
    pub totalReminders: i32,
    pub completedReminders: i32,
    pub completionRate: f64,
    pub tagsUsed: i32,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct CalculationResult {
    pub stats: Stats,
    pub activityData: Vec<ActivityData>,
}

// --- Image Optimization Functionality ---

#[tauri::command]
async fn optimize_image(image_data_base64: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let image_data = general_purpose::STANDARD
            .decode(&image_data_base64)
            .map_err(|e| format!("Base64 decode failed: {}", e))?;

        let img = image::load_from_memory(&image_data)
            .map_err(|e| format!("Image load failed: {}", e))?;

        let (width, height) = (img.width(), img.height());
        let max_dimension = 1920;
        
        let processed_img = if width > max_dimension || height > max_dimension {
            img.resize(max_dimension, max_dimension, image::imageops::FilterType::Lanczos3)
        } else {
            img
        };

        let mut buffer = Cursor::new(Vec::new());
        processed_img
            .write_to(&mut buffer, ImageFormat::WebP)
            .map_err(|e| format!("Image encoding failed: {}", e))?;

        let encoded_webp = general_purpose::STANDARD.encode(buffer.get_ref());
        Ok(encoded_webp)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

// --- Search Functionality ---

#[tauri::command]
fn search_notes(notes: Vec<Note>, query: String) -> Vec<String> {
    let query_lower = query.to_lowercase();
    let query_terms: Vec<&str> = query_lower.split_whitespace().collect();

    notes.into_iter()
        .filter(|note| {
            if query_terms.is_empty() {
                return true;
            }

            let title_lower = note.title.to_lowercase();
            let content_lower = note.content.as_deref().unwrap_or("").to_lowercase();
            
            query_terms.iter().all(|term| {
                if term.starts_with('#') {
                    let tag_query = &term[1..];
                    if let Some(tags) = &note.tags {
                        tags.iter().any(|t| t.to_lowercase().contains(tag_query))
                    } else {
                        false
                    }
                } else {
                    title_lower.contains(term) || content_lower.contains(term)
                }
            })
        })
        .map(|note| note.id)
        .collect()
}

// --- Calculation Functionality ---

#[tauri::command]
fn calculate_activity(notes: Vec<Note>) -> CalculationResult {
    let mut data: HashMap<String, i32> = HashMap::new();
    let mut total_notes = 0;
    let mut total_reminders = 0;
    let mut completed_reminders = 0;
    let mut tags: HashSet<String> = HashSet::new();

    for note in notes {
        total_notes += 1;
        if let Some(note_tags) = &note.tags {
            for tag in note_tags {
                tags.insert(tag.clone());
            }
        }
        if let Some(reminders) = &note.reminders {
            for r in reminders {
                total_reminders += 1;
                if r.completed {
                    completed_reminders += 1;
                    let date_source = r.updated_at.as_ref().or(r.reminder_time.as_ref());
                    if let Some(ds) = date_source {
                         if let Ok(dt) = DateTime::parse_from_rfc3339(ds) {
                             let date_str = dt.format("%Y-%m-%d").to_string();
                             *data.entry(date_str).or_insert(0) += 1;
                         } 
                         else if let Ok(dt) = NaiveDateTime::parse_from_str(ds, "%Y-%m-%dT%H:%M:%S%.f") {
                              let date_str = dt.format("%Y-%m-%d").to_string();
                             *data.entry(date_str).or_insert(0) += 1;
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

    let mut sorted_data: Vec<(String, i32)> = data.into_iter().collect();
    sorted_data.sort_by(|a, b| a.0.cmp(&b.0));

    let activity_data: Vec<ActivityData> = sorted_data.into_iter().map(|(date, count)| {
        let level = std::cmp::min(4, (count as f64 / 2.0).ceil() as i32);
        ActivityData { date, count, level }
    }).collect();

    CalculationResult {
        stats: Stats {
            totalNotes: total_notes,
            totalReminders: total_reminders,
            completedReminders: completed_reminders,
            completionRate: completion_rate,
            tagsUsed: tags.len() as i32,
        },
        activityData: activity_data,
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
      #[cfg(desktop)]
      if let Some(_window) = app.get_webview_window("main") {
        // window.open_devtools();
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