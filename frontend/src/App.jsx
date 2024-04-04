import React, { useState } from "react";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState("");

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: inputValue }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar la solicitud");
      }

      const responseData = await response.json();
      setResponse(responseData.answer);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Hubo un error al procesar la solicitud");
    }
  };

  return (
    <div className="app">
      <section className="main">
        <h1>La RatonerIA</h1>
        <ul className="feed">
          <li>{response}</li>
        </ul>
        <div className="bottom-section">
          <div className="input-container">
            <input value={inputValue} onChange={handleInputChange} />
            <div id="submit" onClick={handleSubmit}>
              ENVIAR
            </div>
          </div>
          <p className="info">by La RatonerIA</p>
        </div>
      </section>
    </div>
  );
}

export default App;
