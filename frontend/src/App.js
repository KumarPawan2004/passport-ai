import React, { useState } from "react";
import {
  Container, Typography, Button, Card, Box,
  ToggleButton, ToggleButtonGroup, CircularProgress,
  ThemeProvider, createTheme, CssBaseline, Grid
} from "@mui/material";
import { CloudUpload, AutoAwesome, Download } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { client } from "@gradio/client";
import { motion, AnimatePresence } from "framer-motion";

// --- CUSTOM PREMIUM THEME ---
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3b82f6" },
    background: {
      default: "transparent",
      paper: "rgba(30, 41, 59, 0.5)", 
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: "none", fontWeight: 600, fontSize: "1rem" },
  },
});

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const popVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } }
};

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [output, setOutput] = useState(null);
  const [bg, setBg] = useState("white");
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    const selected = acceptedFiles[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setOutput(null); 
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return alert("Please upload an image first");

    setLoading(true);
    try {
      const app = await client("PawanKumar788/passport-backend");
      const result = await app.predict("/predict", [file]);

      if (result.data && result.data[0]) {
        setOutput(result.data[0].url);
      } else {
        alert("Received unexpected data format from backend.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing the image.");
    }
    setLoading(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          {/* Header Section */}
          <motion.div variants={itemVariants}>
            <Box textAlign="center" mb={5}>
              <Typography variant="h3" fontWeight="800" gutterBottom sx={{ 
                background: "-webkit-linear-gradient(45deg, #60a5fa, #a78bfa)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent" 
              }}>
                AI Passport Studio
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Instantly crop and format professional passport photos using AI.
              </Typography>
            </Box>
          </motion.div>

          {/* Premium Dropzone with Hover/Drag physics */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              {...getRootProps()}
              sx={{
                p: 6,
                textAlign: "center",
                cursor: "pointer",
                backdropFilter: "blur(20px)",
                border: isDragActive ? "2px solid #3b82f6" : "2px dashed rgba(255,255,255,0.2)",
                background: isDragActive ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.4)",
                transition: "background 0.3s ease, border 0.3s ease",
              }}
            >
              <input {...getInputProps()} />
              <motion.div animate={{ y: isDragActive ? -10 : 0 }} transition={{ type: "spring" }}>
                <CloudUpload sx={{ fontSize: 60, color: isDragActive ? "#3b82f6" : "text.secondary", mb: 2 }} />
              </motion.div>
              <Typography variant="h6" fontWeight="600">
                {isDragActive ? "Drop your photo here..." : "Drag & Drop your photo here"}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                or click to browse from your computer
              </Typography>
            </Card>
          </motion.div>

          {/* Background Color Toggle */}
          <motion.div variants={itemVariants}>
            <Box mt={4} textAlign="center">
              <Typography variant="overline" color="text.secondary" display="block" mb={1}>
                Select Background Color
              </Typography>
              <ToggleButtonGroup
                value={bg}
                exclusive
                onChange={(e, val) => val && setBg(val)}
                sx={{ background: "rgba(0,0,0,0.2)", borderRadius: 3 }}
              >
                <ToggleButton value="white" sx={{ px: 4, py: 1 }}>White</ToggleButton>
                <ToggleButton value="blue" sx={{ px: 4, py: 1 }}>Blue</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </motion.div>

          {/* Action Button (Pulses when loading) */}
          <motion.div variants={itemVariants}>
            <Box mt={5} textAlign="center">
              <motion.div animate={loading ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleUpload}
                  disabled={loading || !file}
                  startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <AutoAwesome />}
                  sx={{
                    py: 1.5,
                    px: 6,
                    borderRadius: "50px",
                    background: "linear-gradient(45deg, #2563eb, #7c3aed)",
                    boxShadow: loading ? "0 0 30px rgba(124, 58, 237, 0.8)" : "0 10px 20px -10px rgba(124, 58, 237, 0.5)",
                    "&:hover": { background: "linear-gradient(45deg, #1d4ed8, #6d28d9)" },
                  }}
                >
                  {loading ? "AI is processing..." : "Generate Passport Photo"}
                </Button>
              </motion.div>
            </Box>
          </motion.div>

          {/* Image Display Grid (Animate Presence handles the pop-ins) */}
          <AnimatePresence>
            {preview && (
              <Grid container spacing={4} mt={4} justifyContent="center">
                
                {/* Before Card */}
                <Grid item xs={12} sm={output ? 6 : 8}>
                  <motion.div variants={popVariants} initial="hidden" animate="visible" exit="hidden">
                    <Card sx={{ p: 2, backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Typography variant="button" color="text.secondary" display="block" textAlign="center" mb={2}>
                        Original Photo
                      </Typography>
                      <Box sx={{ width: "100%", height: 350, display: "flex", justifyContent: "center", alignItems: "center", background: "#000", borderRadius: 2, overflow: "hidden" }}>
                        <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>

                {/* After Card */}
                {output && (
                  <Grid item xs={12} sm={6}>
                    <motion.div variants={popVariants} initial="hidden" animate="visible" exit="hidden" transition={{ delay: 0.2 }}>
                      <Card sx={{ p: 2, backdropFilter: "blur(20px)", border: "1px solid #3b82f6", boxShadow: "0 0 30px -10px rgba(59, 130, 246, 0.3)" }}>
                        <Typography variant="button" color="primary" display="block" textAlign="center" mb={2}>
                          Passport Ready
                        </Typography>
                        <Box sx={{ width: "100%", height: 350, display: "flex", justifyContent: "center", alignItems: "center", background: "#000", borderRadius: 2, overflow: "hidden" }}>
                          <motion.img 
                            initial={{ filter: "blur(10px)", opacity: 0 }} 
                            animate={{ filter: "blur(0px)", opacity: 1 }} 
                            transition={{ duration: 0.8 }}
                            src={output} alt="Output" style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                          />
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<Download />}
                          href={output}
                          download="passport-photo.jpg"
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Download High-Res
                        </Button>
                      </Card>
                    </motion.div>
                  </Grid>
                )}
              </Grid>
            )}
          </AnimatePresence>

        </motion.div>
      </Container>
    </ThemeProvider>
  );
}

export default App;