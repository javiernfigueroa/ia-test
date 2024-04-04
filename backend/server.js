// backend/server.js
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const { OpenAI } = require('openai');
const { Pool } = require('pg')

// Confi Express
const app = express();
const port = 3001;

app.use(cors());

//Confi Api
const openai = new OpenAI({ apiKey: '' });

// Middlewares
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cervecerias',
  password: 'admin1234',
  port: 5432,
});


//Al levantar el servidor, hacemos una consulta a la base de datos para actualizar sus datos:
async function consultarLocales() {
  try {
      // Consulta a la base de datos
      const query = `
          SELECT
              l.nombre AS nombre_local,
              p.nombre AS nombre_producto,
              lp.precio AS precio_producto
          FROM
              locales l
          JOIN
              locales_productos lp ON l.id = lp.local_id
          JOIN
              productos p ON lp.producto_id = p.id
          WHERE
              l.id BETWEEN 1 AND 10;
      `;
      const { rows } = await pool.query(query);

      localesData = rows;
      // Convertir los resultados de la base de datos a formato JSON
      const newData = JSON.stringify(rows, null, 2); // 2 espacios de sangría

      // Leer el contenido actual del archivo JSON
      let currentData = null;
      try {
          currentData = fs.readFileSync('data.json', 'utf8');
      } catch (error) {
          // Si el archivo no existe, se asume que no hay datos anteriores
          // y se procede a escribir el nuevo archivo
          currentData = null;
      }

      // Verificar si los datos actuales son iguales a los nuevos
      if (currentData !== newData) {
          // Si son diferentes, escribir el nuevo archivo
          await fs.writeFile('data.json', newData, (err) => {
              if (err) throw err;
              console.log('Consulta a la base de datos realizada y resultados guardados en consulta_locales.json');
          });
      } else {
          // Si son iguales, mostrar un mensaje indicando que no hay cambios
          console.log('Los datos actuales son iguales a los resultados de la última consulta. No se realizará una nueva consulta.');
      }
  } catch (error) {
      console.error('Error al procesar la consulta:', error);
  }
}

//Ejecuto
consultarLocales();

//Leer archivo que almacena los datos
function readData() {
  const rawData = fs.readFileSync('data.json');
  return JSON.parse(rawData);
}

// Endpoint solicitud y preguntas
app.post('/ask', async (req, res) => {
    const { question } = req.body;
    try {
      // Leemos el archivo JSON
      const data = readData();
      // Construimos el prompt con todas las entradas del archivo JSON
      let prompt = `Pregunta: ${question}\n`;
      data.forEach(entry => {
        prompt += `Local: ${entry.nombre_local}\nProducto: ${entry.nombre_producto}\nPrecio: ${entry.precio_producto}\n\n`;
      });
      // Enviamos la solicitud al modelo de OpenAI
      const response = await openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt,
        temperature: 0.7,
        max_tokens: 1000,
      });
      let answer = '';
      // Procesamos la respuesta del modelo
      if (response.choices && response.choices.length > 0) {
        answer = response.choices[0].text.trim();
      } else {
        answer = 'No se pudo obtener una respuesta válida del modelo.';
      }
      res.json({ answer });
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      res.status(500).json({ error: 'Hubo un error al procesar la solicitud' });
    }
  });

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
