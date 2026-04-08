import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { client } from "@gradio/client"; // Import the Gradio client

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [output, setOutput] = useState(null);
  const [bg, setBg] = useState("white");
  const [loading, setLoading] = useState(false);

  // Drag & Drop
  const onDrop = (acceptedFiles) => {
    const selected = acceptedFiles[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Upload - UPDATED FOR GRADIO
  const handleUpload = async () => {
    if (!file) return alert("Upload image first");

    setLoading(true);

    try {
      // 1. Connect to your live Render backend
      const app = await client("https://passport-ai-backend-znva.onrender.com/");
      
      // 2. Send the image file to Gradio's default /predict endpoint
      const result = await app.predict("/predict", [
        file, 
      ]);

      // 3. Gradio returns a URL to the processed image
      if (result.data && result.data[0]) {
        setOutput(result.data[0].url);
      } else {
        alert("Received unexpected data format from backend.");
      }

    } catch (err) {
      console.error(err);
      alert("Error processing the image. Check the console for details.");
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: 40 }}>
      <Typography variant="h4" align="center" gutterBottom>
        AI Passport Photo Generator
      </Typography>

      {/* Drag & Drop */}
      <Card
        {...getRootProps()}
        style={{
          padding: 30,
          textAlign: "center",
          cursor: "pointer",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)"
        }}
      >
        <input {...getInputProps()} />
        <Typography>Drag & Drop or Click to Upload</Typography>
      </Card>

      {/* Background Selector (Note: Backend currently only applies white) */}
      <Box mt={2} textAlign="center">
        <ToggleButtonGroup
          value={bg}
          exclusive
          onChange={(e, val) => val && setBg(val)}
        >
          <ToggleButton value="white">White</ToggleButton>
          <ToggleButton value="blue">Blue</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Preview + Output */}
      <Box mt={3} display="flex" justifyContent="space-around">
        {preview && (
          <Card>
            <CardContent>
              <Typography align="center">Before</Typography>
              <img src={preview} width="180" alt="Preview" />
            </CardContent>
          </Card>
        )}

        {output && (
          <Card>
            <CardContent>
              <Typography align="center">After</Typography>
              <img src={output} width="180" alt="Output" />
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Button */}
      <Box mt={3} textAlign="center">
        <Button variant="contained" onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Generate Passport Photo"}
        </Button>
      </Box>

      {/* Download */}
      {output && (
        <Box mt={2} textAlign="center">
          <Button variant="outlined" href={output} download="passport-photo.jpg">
            Download
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;