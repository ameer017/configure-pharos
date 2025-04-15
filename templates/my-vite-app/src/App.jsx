import "./constant/connection";
import { use, useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import "./index.css";

import contractABI from "./constant/abi.json";

function App() {
  const [number, setNumber] = useState(0);
  const [newNumber, setNewNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);

  async function getContract() {
    if (!window.ethereum) {
      console.error("MetaMask is not installed");
      return null;
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new Contract(contractABI.address, contractABI.abi, signer);
  }

  const fetchNumber = async () => {
    const contract = await getContract();
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }
    try {
      const num = await contract.number();
      setNumber(num.toString());
    } catch (error) {
      console.error("Error fetching number:", error);
    }
  };

  useEffect(() => {
    fetchNumber();
  }, []);

  async function handleSetNumber() {
    const contract = await getContract();
    if (!contract) return;

    setIsLoading(true);
    try {
      const tx = await contract.setNumber(newNumber);
      await tx.wait();
      await fetchNumber();
    } catch (error) {
      console.error("Error setting number:", error);
    }
    setIsLoading(false);
  }

  async function handleIncrement() {
    const contract = await getContract();
    if (!contract) return;

    try {
      isIncreasing(true);
      const tx = await contract.increment();
      await tx.wait();
      isIncreasing(false);
      await fetchNumber();
    } catch (error) {
      isIncreasing(false);
      console.error("Error incrementing number:", error);
    }
  }

  return (
    <div className="container">
      <h1>Pharos Counter</h1>
      <p>
        Current Number: <strong>{number}</strong>
      </p>

      <div>
        <input
          type="text"
          placeholder="Enter number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
        />

        <div className="button-container">
          <button onClick={handleSetNumber} disabled={isLoading}>
            {isLoading ? "Processing..." : "Set Number"}
          </button>
          <button onClick={handleIncrement}>Increment</button>
        </div>
      </div>

      <appkit-button size="md" />
      {isLoading && <p>⏳ Transaction in progress...</p>}
      {isIncreasing && <p> ⬆️ Incrementing {number} ...</p>}
    </div>
  );
}

export default App;
