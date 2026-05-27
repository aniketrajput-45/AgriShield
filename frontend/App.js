import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { calculateNPK } from './src/services/fertilizerService';
import { fetchWeather } from './src/services/weatherService';
import { analyzeImage } from './src/services/diagnosisService';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState("System Ready");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Weather and Location State
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Diagnosis Result State
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fertilizer Form State
  const [plotSize, setPlotSize] = useState('1');
  const [crop, setCrop] = useState('Tomato');
  const [dosage, setDosage] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to see weather risks.');
        setLoadingWeather(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        const weatherData = await fetchWeather(loc.coords.latitude, loc.coords.longitude);
        setWeather(weatherData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingWeather(false);
      }
    })();
  }, []);

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "We need camera access to scan leaves.");
        return;
      }
    }
    setIsScanning(true);
  };

  const handleCalculate = () => {
    const size = parseFloat(plotSize);
    if (isNaN(size) || size <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid plot size in acres.");
      return;
    }
    const result = calculateNPK(crop, size);
    setDosage(result);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "We need gallery access to upload images.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      processDiagnosis(result.assets[0].uri);
    }
  };

  const processDiagnosis = async (imageUri) => {
    setIsScanning(false);
    setIsAnalyzing(true);
    setStatus(`Analyzing ${crop}...`);
    
    try {
      const weatherContext = weather ? `${weather.condition}, ${weather.temp}°C, ${weather.humidity}% humidity` : "";
      const result = await analyzeImage(imageUri, weatherContext, crop);
      
      setDiagnosis(result);
      setIsAnalyzing(false);
      setShowResult(true);
      setStatus("Analysis Complete");
    } catch (error) {
      setIsAnalyzing(false);
      setIsScanning(false);
      setStatus("Analysis Failed");
      Alert.alert("Error", "Could not analyze image. Check your backend connection.");
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        processDiagnosis(photo.uri);
      } catch (error) {
        Alert.alert("Error", "Capture failed.");
      }
    }
  };

  if (isScanning) {
    return (
      <SafeAreaProvider>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.fullCamera} facing="back" />
          
          <SafeAreaView style={[styles.cameraOverlay, StyleSheet.absoluteFill]}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => setIsScanning(false)}>
                <Text style={styles.closeText}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Leaf Scanner</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <View style={styles.vignette}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
                <Text style={{fontSize: 24}}>🖼️</Text>
                <Text style={styles.galleryText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureCircle} onPress={handleCapture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <View style={{ width: 60 }} /> 
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, Farmer</Text>
            <Text style={styles.brandTitle}>AgriShield</Text>
          </View>
          <View style={styles.avatarPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status Card */}
          <View style={[styles.statusCard, { backgroundColor: isAnalyzing ? '#FF8F00' : '#1B5E20' }]}>
            <Text style={styles.statusLabel}>System Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.statusValue}>{status}</Text>
              {isAnalyzing && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 15 }} />}
            </View>
          </View>

          {/* Feature Grid */}
          <View style={styles.grid}>
            <View style={styles.featureCard}>
              <Text style={styles.cardEmoji}>☁️</Text>
              <Text style={styles.cardTitle}>Weather Risk</Text>
              {loadingWeather ? (
                <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 10 }} />
              ) : weather ? (
                <>
                  <Text style={styles.cardDetail}>{weather.condition} ({weather.temp}°C)</Text>
                  <Text style={[styles.cardAlert, { color: weather.risk === 'High' ? '#D32F2F' : '#2E7D32' }]}>
                    Fungal Risk: {weather.risk}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardDetail}>Weather Unavailable</Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.featureCard} onPress={() => setIsCalculating(true)}>
              <Text style={styles.cardEmoji}>🧪</Text>
              <Text style={styles.cardTitle}>Fertilizer</Text>
              <Text style={styles.cardDetail}>NPK Calculator</Text>
              <Text style={styles.cardAction}>Check Dosage</Text>
            </TouchableOpacity>
          </View>

          {/* Main Action Area */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Select Crop & Diagnose</Text>
            
            <View style={[styles.cropSelector, { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 20 }]}>
                {['Tomato', 'Rice', 'Wheat', 'Maize'].map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.cropBtn, crop === c && styles.cropBtnActive]}
                    onPress={() => setCrop(c)}
                  >
                    <Text style={[styles.cropBtnText, crop === c && styles.cropBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.mainScanButton} onPress={handleStartScan}>
              <View style={styles.buttonIconCircle}>
                <Text style={{fontSize: 30}}>📸</Text>
              </View>
              <View>
                <Text style={styles.scanButtonTitle}>Scan {crop}</Text>
                <Text style={styles.scanButtonSub}>AI Disease Detection</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* History/Heatmap Preview */}
          <View style={styles.heatmapCard}>
            <Text style={styles.heatmapTitle}>Regional Outbreak Map</Text>
            <View style={styles.mapPlaceholder}>
              {location ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.mapText}>📍 {weather?.city || 'Your Location'}</Text>
                  <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                    {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.mapText}>Local Heatmap Loading...</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Fertilizer Modal */}
        <Modal visible={isCalculating} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {setIsCalculating(false); setDosage(null);}}>
                <Text style={styles.closeBtn}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>NPK Calculator</Text>
              <View style={{width: 40}} />
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Plot Size (Acres)</Text>
              <TextInput 
                style={styles.input}
                keyboardType="numeric"
                value={plotSize}
                onChangeText={setPlotSize}
                placeholder="e.g. 2.5"
              />

              <Text style={styles.inputLabel}>Crop Type</Text>
              <View style={styles.cropSelector}>
                {['Tomato', 'Rice', 'Wheat', 'Maize'].map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.cropBtn, crop === c && styles.cropBtnActive]}
                    onPress={() => setCrop(c)}
                  >
                    <Text style={[styles.cropBtnText, crop === c && styles.cropBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.calcButton} onPress={handleCalculate}>
                <Text style={styles.calcButtonText}>Calculate Dosage</Text>
              </TouchableOpacity>

              {dosage && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultTitle}>Recommended NPK (kg):</Text>
                  <View style={styles.resultGrid}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resLabel}>N</Text>
                      <Text style={styles.resValue}>{dosage.N}</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resLabel}>P</Text>
                      <Text style={styles.resValue}>{dosage.P}</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resLabel}>K</Text>
                      <Text style={styles.resValue}>{dosage.K}</Text>
                    </View>
                  </View>
                  <Text style={styles.resultNote}>* Based on standard soil health for {crop}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* AI Diagnosis Result Modal */}
        <Modal visible={showResult} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.resultModalContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultModalTitle}>Diagnosis Report</Text>
                <TouchableOpacity onPress={() => setShowResult(false)}>
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.resultBody}>
                {diagnosis && (
                  <>
                    <View style={styles.diseaseInfoCard}>
                      <Text style={styles.resLabel}>Detected Condition</Text>
                      <Text style={styles.diseaseNameText}>{diagnosis.disease}</Text>
                      <Text style={styles.confidenceText}>
                        Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                      </Text>
                    </View>

                    <View style={styles.adviceSection}>
                      <Text style={styles.adviceTitle}>Expert Treatment Plan</Text>
                      <View style={styles.adviceCard}>
                        <Text style={styles.adviceText}>{diagnosis.treatment}</Text>
                      </View>
                      <Text style={styles.disclaimer}>
                        * Advice generated by AI Advisor. Consult a local expert before applying chemical treatments.
                      </Text>
                    </View>
                  </>
                )}

                <TouchableOpacity 
                  style={styles.doneButton} 
                  onPress={() => setShowResult(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 20,
    paddingBottom: 25,
    backgroundColor: '#fff'
  },
  welcomeText: { fontSize: 16, color: '#888', fontWeight: '500' },
  brandTitle: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#E8F5E9' },
  
  scrollContent: { padding: 20 },
  
  statusCard: {
    backgroundColor: '#2E7D32',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
  },
  statusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 5 },

  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  featureCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardEmoji: { fontSize: 24, marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  cardDetail: { fontSize: 12, color: '#777', marginTop: 4 },
  cardAlert: { fontSize: 11, color: '#D32F2F', fontWeight: 'bold', marginTop: 8 },
  cardAction: { fontSize: 11, color: '#2E7D32', fontWeight: 'bold', marginTop: 8 },

  actionSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  mainScanButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scanButtonTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  scanButtonSub: { fontSize: 13, color: '#666' },

  heatmapCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15 },
  heatmapTitle: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 12 },
  mapPlaceholder: { height: 150, backgroundColor: '#F0F0F0', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#999', fontSize: 13 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeBtn: { color: '#2E7D32', fontSize: 16, fontWeight: 'bold' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 25 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F4F7F5', padding: 15, borderRadius: 12, fontSize: 18, fontWeight: 'bold' },
  cropSelector: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 10 },
  cropBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F4F7F5', borderWidth: 1, borderColor: '#eee' },
  cropBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  cropBtnText: { color: '#555' },
  cropBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  calcButton: { backgroundColor: '#2E7D32', padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center' },
  calcButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultContainer: { marginTop: 30, padding: 20, backgroundColor: '#E8F5E9', borderRadius: 20 },
  resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginBottom: 15 },
  resultGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  resultItem: { alignItems: 'center' },
  resLabel: { fontSize: 12, color: '#666' },
  resValue: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
  resultNote: { fontSize: 11, color: '#666', marginTop: 15, fontStyle: 'italic' },

  // Camera Styles
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  fullCamera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center' 
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cameraTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  vignette: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetFrame: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  cameraFooter: { 
    paddingBottom: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-around',
    paddingHorizontal: 20
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 65,
    height: 65,
    borderRadius: 33,
  },
  galleryText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  hintText: { color: '#fff', fontSize: 14, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10 },
  captureCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },

  // New Result Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  resultModalContainer: { backgroundColor: '#fff', borderRadius: 30, maxHeight: '80%', overflow: 'hidden' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  closeModalText: { fontSize: 24, color: '#999', padding: 5 },
  resultBody: { padding: 20 },
  diseaseInfoCard: { backgroundColor: '#F1F8E9', padding: 20, borderRadius: 20, marginBottom: 20, alignItems: 'center' },
  diseaseNameText: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginVertical: 8 },
  confidenceText: { fontSize: 14, color: '#666' },
  adviceSection: { marginBottom: 25 },
  adviceTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  adviceCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', padding: 15, borderRadius: 15 },
  adviceText: { fontSize: 16, color: '#444', lineHeight: 24 },
  disclaimer: { fontSize: 11, color: '#999', marginTop: 15, fontStyle: 'italic' },
  doneButton: { backgroundColor: '#2E7D32', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
  });