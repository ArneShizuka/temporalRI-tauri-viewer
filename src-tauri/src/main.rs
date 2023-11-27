// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dunce::canonicalize;
use std::process::{Command, Stdio};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[tauri::command]
async fn launch_temporal_ri(
    handle: tauri::AppHandle,
    target_path: &str,
    query_path: &str,
) -> Result<String, String> {
    let temporal_ri_jar_path = handle
        .path_resolver()
        .resolve_resource("../java/TemporalRI.jar");

    let temporal_ri_jar_path =
        temporal_ri_jar_path.ok_or_else(|| "Failed to resolve TemporalRI.jar".to_string())?;

    let temporal_ri_jar_path = canonicalize(temporal_ri_jar_path)
        .map_err(|err| format!("Failed to canonicalize path: {}", err))?;

    let mut cmd = Command::new("java");

    cmd.arg("-jar")
        .arg(&temporal_ri_jar_path)
        .arg("-t")
        .arg(&target_path)
        .arg("-q")
        .arg(&query_path)
        .arg("-o")
        .stdout(Stdio::piped());

    // Prevents cmd window to be created on Windows
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd.output().unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();

    let result = process_output(&stdout).unwrap_or_else(|| "No occurrences found".to_string());

    Ok(result)
}

fn process_output(output: &str) -> Option<String> {
    if let Some(count_start) = output.find("Occurrences found:") {
        if let Some(count_end) = output[count_start..].find("\n") {
            let count_end = count_start + count_end;
            if let Some(count_str) =
                output[count_start..count_end].strip_prefix("Occurrences found:")
            {
                if let Ok(count) = count_str.trim().parse::<usize>() {
                    if count > 0 {
                        if let Some(found_index) = output.find("Edges") {
                            if let Some(occurrences_start) = output[found_index..].find("\n") {
                                let start = found_index + occurrences_start;
                                if let Some(occurrences_end) = output[start..].find("Done!") {
                                    let end = start + occurrences_end;

                                    return Some(output[start..end].trim().to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_temporal_ri])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
