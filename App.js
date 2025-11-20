import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  Image,
  TextInput,
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const App = () => {
  const [isLoading, setLoading] = useState(true); // Cambiado a true para mostrar loading inicial
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(true);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showProgress, setShowProgress] = useState(false);

  // Función para validar que solo contenga letras y espacios
  const soloLetras = (texto) => {
    return /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(texto);
  };

  const getPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://picsum.photos/v2/list?page=1&limit=50');
      const json = await response.json();
      // Ordenar A-Z por autor
      const sorted = json.sort((a, b) => a.author.localeCompare(b.author));
      setPhotos(sorted);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las fotos');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setShowProgress(false);
    }
  };

  const handleLogin = () => {
    // Validar campos vacíos
    if (nombre.trim() === '' || apellido.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    // Validar que nombre solo contenga letras
    if (!soloLetras(nombre)) {
      Alert.alert('Error', 'El nombre solo puede contener letras');
      return;
    }

    // Validar que apellido solo contenga letras
    if (!soloLetras(apellido)) {
      Alert.alert('Error', 'El apellido solo puede contener letras');
      return;
    }

    // Validar longitud de password
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Mostrar progress bar antes de cargar los datos
    setShowProgress(true);
    setIsLoggedIn(true);
    setLoginModalVisible(false);
    
    // Cargar las fotos después del login
    getPhotos();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getPhotos();
  }, []);

  const tomarFoto = async () => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Guardar foto si no fue cancelada
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0].uri);
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoItem}>
      <Image 
        source={{ uri: item.download_url }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
      <Text style={styles.photoAuthor}>Autor: {item.author}</Text>
      <Text style={styles.photoSize}>Dimensiones: {item.width} x {item.height}</Text>
    </View>
  );

  // PANTALLA DE LOGIN
  if (!isLoggedIn) {
    return (
      <Modal animationType="slide" transparent={false} visible={loginModalVisible}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Iniciar Sesión</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre (solo letras)"
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido (solo letras)"
            value={apellido}
            onChangeText={setApellido}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Ingresar</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  // INTERFAZ INTERMEDIA CON PROGRESS BAR
  if (showProgress) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://picsum.photos/800/400?blur' }}
          style={styles.progressContainer}
        >
          <View style={styles.progressOverlay}>
            <Text style={styles.progressTitle}>Cargando Galería</Text>
            <ActivityIndicator size="large" color="#ffffff" style={styles.progressSpinner} />
            <Text style={styles.progressText}>Preparando tu experiencia...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // PANTALLA PRINCIPAL
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Galería de Fotos</Text>
        <Text style={styles.headerSubtitle}>Bienvenido: {nombre} {apellido}</Text>
      </View>

      {/* SECCIÓN DE PERFIL */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profilePlaceholderText}>Sin foto</Text>
            </View>
          )}
          <Text style={styles.profileName}>{nombre} {apellido}</Text>
        </View>

        <Pressable style={styles.photoButton} onPress={tomarFoto}>
          <Text style={styles.photoButtonText}> Tomar Foto de Perfil</Text>
        </Pressable>
      </View>

      {/* LISTA DE FOTOS */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Galería de Fotos (Orden A-Z)</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Cargando fotos...</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={renderPhotoItem}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#007bff']}
                tintColor="#007bff"
              />
            }
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // LOGIN STYLES
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  loginButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // PROGRESS BAR STYLES
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressSpinner: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  // HEADER STYLES
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  // PROFILE SECTION STYLES
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  profilePlaceholderText: {
    color: '#6c757d',
    fontSize: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 15,
    flex: 1,
  },
  photoButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // LIST STYLES
  listContainer: {
    flex: 1,
    padding: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  photoItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  photoAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  photoSize: {
    fontSize: 14,
    color: '#6c757d',
  },
});

export default App;