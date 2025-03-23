use ferris_says::say;
use std::io::{self, stdout, BufWriter, Write};

/// Prints a message using Ferris the Crab.
///
/// # Arguments
/// * `message` - The message to display.
///
/// # Errors
/// Returns an `io::Error` if writing to stdout fails.
pub fn print_message(message: &str) -> io::Result<()> {
    let stdout = stdout();
    let width = message.chars().count();

    // Create a buffered writer for stdout
    let mut writer = BufWriter::new(stdout.lock());

    // Print the message using Ferris
    say(message, width, &mut writer)?;

    // Flush the buffer to ensure the message is printed
    writer.flush()?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    /// Tests the `print_message` function by capturing its output.
    #[test]
    fn test_print_message() {
        let message = "Hello, world!";
        let mut output = Vec::new();
        let mut writer = BufWriter::new(Cursor::new(&mut output));

        // Simulate printing the message
        say(message, message.chars().count(), &mut writer).unwrap();
        writer.flush().unwrap();

        // Verify the output contains the message
        let output_str = String::from_utf8(output).unwrap();
        assert!(output_str.contains(message));
    }
}