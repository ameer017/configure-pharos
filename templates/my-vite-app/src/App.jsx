import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";

// Counter Contract ABI
import contractABI from "./constant/abi.json";

// Replace with your deployed contract address
const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";

function App() {
  const [number, setNumber] = useState(0);
  const [newNumber, setNewNumber] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  // Initialize contract connection
  useEffect(() => {
    async function loadBlockchain() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setProvider(provider);
        setSigner(signer);
        setContract(contract);

        fetchNumber(contract);
      } else {
        alert("Please install MetaMask!");
      }
    }
    loadBlockchain();
  }, []);

  // Fetch current number from contract
  async function fetchNumber(contract) {
    try {
      const num = await contract.number();
      setNumber(num.toString());
    } catch (error) {
      console.error("Error fetching number:", error);
    }
  }

  // Set new number
  async function handleSetNumber() {
    if (!contract) return;
    try {
      const tx = await contract.setNumber(newNumber);
      await tx.wait();
      fetchNumber(contract);
    } catch (error) {
      console.error("Error setting number:", error);
    }
  }

  // Increment number
  async function handleIncrement() {
    if (!contract) return;
    try {
      const tx = await contract.increment();
      await tx.wait();
      fetchNumber(contract);
    } catch (error) {
      console.error("Error incrementing number:", error);
    }
  }

  return (
    <div className="container">
      <h1>Counter DApp</h1>
      <p>
        Current Number: <strong>{number}</strong>
      </p>

      <div>
        <input
          type="number"
          placeholder="Enter number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
        />
        <button onClick={handleSetNumber}>Set Number</button>
      </div>

      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
}

export default App;
