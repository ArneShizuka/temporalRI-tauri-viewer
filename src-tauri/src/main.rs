// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dunce::canonicalize;
use std::process::{Command, Stdio};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[tauri::command]
fn launch_temporal_ri(
    handle: tauri::AppHandle,
    target_path: &str,
    query_path: &str,
    undirected: &str,
    delta: &str,
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

    if undirected == "true" {
        cmd.arg("-u");
    }

    if delta != "inf" {
        cmd.arg("-d").arg(delta);
    }

    // Prevents cmd window to be created on Windows
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output_result = cmd.output();

    match output_result {
        Ok(output) => {
            let stdout = String::from_utf8(output.stdout).unwrap();
            let result =
                process_output(&stdout).unwrap_or_else(|| "No occurrences found".to_string());
            Ok(result)
        }
        Err(err) => Err(format!("Failed to execute command: {}", err)),
    }
}

fn process_output(output: &str) -> Option<String> {
    let re = regex::Regex::new(
        r"Edges(\r|\n)(?P<occurrences>[\s\S]+?)Done! Occurrences found: (?P<count>\d+)",
    )
    .unwrap();

    if let Some(matches) = re.captures(output) {
        if &matches["count"] == "0" {
            return None;
        }

        return Some(matches["occurrences"].trim().to_string());
    }

    None
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_temporal_ri])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
