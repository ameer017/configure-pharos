// Simple Counter DApp in Rust (No dependencies)

use std::collections::HashMap;
use std::io;

// Our "blockchain" state - in a real DApp this would be stored on-chain
struct Blockchain {
    accounts: HashMap<String, Account>,
}

struct Account {
    balance: u64,
    counters: HashMap<String, i64>, // Each account can have multiple counters
}

impl Blockchain {
    fn new() -> Self {
        Blockchain {
            accounts: HashMap::new(),
        }
    }

    fn get_or_create_account(&mut self, address: &str) -> &mut Account {
        if !self.accounts.contains_key(address) {
            self.accounts.insert(address.to_string(), Account {
                balance: 100, // Starting balance
                counters: HashMap::new(),
            });
        }
        self.accounts.get_mut(address).unwrap()
    }

    fn create_counter(&mut self, address: &str, counter_name: &str) {
        let account = self.get_or_create_account(address);
        account.counters.insert(counter_name.to_string(), 0);
    }

    fn increment_counter(&mut self, address: &str, counter_name: &str) -> Result<(), String> {
        let account = self.get_or_create_account(address);
        if let Some(counter) = account.counters.get_mut(counter_name) {
            *counter += 1;
            Ok(())
        } else {
            Err(format!("Counter '{}' not found", counter_name))
        }
    }

    fn decrement_counter(&mut self, address: &str, counter_name: &str) -> Result<(), String> {
        let account = self.get_or_create_account(address);
        if let Some(counter) = account.counters.get_mut(counter_name) {
            *counter -= 1;
            Ok(())
        } else {
            Err(format!("Counter '{}' not found", counter_name))
        }
    }

    fn get_counter(&self, address: &str, counter_name: &str) -> Option<i64> {
        self.accounts.get(address)
            .and_then(|account| account.counters.get(counter_name))
            .copied()
    }
}

fn main() {
    println!("Simple Counter DApp");
    println!("-------------------");

    let mut blockchain = Blockchain::new();

    // For simplicity, we'll use a fixed account address
    let address = "user1";

    // Create a default counter
    blockchain.create_counter(address, "default");

    loop {
        println!("\nCurrent counter value: {}", 
            blockchain.get_counter(address, "default").unwrap_or(0));
        println!("Choose an action:");
        println!("1. Increment counter");
        println!("2. Decrement counter");
        println!("3. Exit");

        let mut choice = String::new();
        io::stdin().read_line(&mut choice).expect("Failed to read line");

        match choice.trim() {
            "1" => {
                if let Err(e) = blockchain.increment_counter(address, "default") {
                    println!("Error: {}", e);
                }
            },
            "2" => {
                if let Err(e) = blockchain.decrement_counter(address, "default") {
                    println!("Error: {}", e);
                }
            },
            "3" => break,
            _ => println!("Invalid choice"),
        }
    }
}