import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, type Region } from 'react-native-maps';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';

import { useAttendance } from '@/contexts/AttendanceContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  OFFICE_LATITUDE,
  OFFICE_LONGITUDE,
} from '@/constants/office';
import {
  punchOfficeAttendanceWithSelfie,
  getAttendanceErrorMessage,
} from '@/services/attendanceApi';
import {
  formatDistance,
  getAttendanceStatusLabel,
  getDistanceFromOffice,
  isWithinOfficeRadius,
} from '@/utils/location';

const OFFICE_REGION: Region = {
  latitude: OFFICE_LATITUDE,
  longitude: OFFICE_LONGITUDE,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function OfficePunchScreen() {
  const { markOfficeCheckIn } = useAttendance();
  const { employeeId } = useAuth();
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const distanceMeters =
    latitude !== null && longitude !== null
      ? getDistanceFromOffice(latitude, longitude)
      : null;

  const withinRange =
    latitude !== null &&
    longitude !== null &&
    isWithinOfficeRadius(latitude, longitude);

  const statusLabel = getAttendanceStatusLabel(
    latitude,
    longitude,
    isLoadingLocation
  );

  const loadLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to register office attendance.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      mapRef.current?.fitToCoordinates(
        [
          { latitude: lat, longitude: lng },
          {
            latitude: OFFICE_LATITUDE,
            longitude: OFFICE_LONGITUDE,
          },
        ],
        {
          edgePadding: {
            top: 80,
            right: 48,
            bottom: 280,
            left: 48,
          },
          animated: true,
        }
      );
    } catch {
      Alert.alert(
        'Location Error',
        'Unable to fetch your GPS coordinates. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const openCameraAfterGpsSuccess = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to capture your attendance selfie.'
        );
        return;
      }
    }

    setCameraVisible(true);
  };

  const handleRegisterAttendance = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert('Location Unavailable', 'Waiting for GPS coordinates.');
      return;
    }

    if (!isWithinOfficeRadius(latitude, longitude)) {
      Alert.alert(
        'Outside Office Range',
        'You must be within the office radius to register attendance.'
      );
      return;
    }

    try {
      setIsRegistering(true);
      await openCameraAfterGpsSuccess();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
      });

      if (!photo?.uri) {
        Alert.alert('Capture Failed', 'Could not capture selfie. Please try again.');
        return;
      }

      setPhotoUri(photo.uri);
      setCameraVisible(false);
    } catch {
      Alert.alert('Capture Failed', 'Could not capture selfie. Please try again.');
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setCameraVisible(true);
  };

  const completeAttendance = async () => {
    if (employeeId === null) {
      Alert.alert('Session Error', 'Please log in again.');
      router.replace('/');
      return;
    }

    if (photoUri === null) {
      Alert.alert('Photo Missing', 'Please capture a selfie first.');
      return;
    }

    try {
      setIsRegistering(true);

      const result = await punchOfficeAttendanceWithSelfie({
        employeeId,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        selfieUri: photoUri,
        attendanceType: 'Office',
      });

      if (result.success) {
        markOfficeCheckIn();
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Attendance Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Attendance Failed', getAttendanceErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  };

  if (photoUri) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.previewContainer} edges={['top', 'bottom']}>
          <Text style={styles.previewTitle}>Selfie Preview</Text>
          <Text style={styles.previewSubtitle}>
            Confirm your photo to complete attendance
          </Text>

          <View style={styles.previewImageWrap}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              isRegistering && styles.registerButtonDisabled,
            ]}
            onPress={completeAttendance}
            activeOpacity={0.9}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>
                Complete Attendance
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakePhoto}
            activeOpacity={0.85}
          >
            <Text style={styles.retakeButtonText}>Retake Selfie</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
            <Text style={styles.cameraTitle}>Attendance Selfie</Text>
            <Text style={styles.cameraSubtitle}>
              Position your face in the frame
            </Text>

            <View style={styles.cameraSpacer} />

            <TouchableOpacity
              style={styles.captureButton}
              onPress={capturePhoto}
              activeOpacity={0.9}
            >
              <Text style={styles.captureText}>Capture Selfie</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={OFFICE_REGION}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {latitude !== null && longitude !== null && (
            <Marker
              coordinate={{ latitude, longitude }}
              title="You"
              pinColor="#2563EB"
            />
          )}
          <Marker
            coordinate={{
              latitude: OFFICE_LATITUDE,
              longitude: OFFICE_LONGITUDE,
            }}
            title="Office"
            pinColor="#059669"
          />
        </MapView>

        {isLoadingLocation && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.mapLoadingText}>
              Getting your location…
            </Text>
          </View>
        )}

        <SafeAreaView style={styles.topBar} edges={['top']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Office Punch</Text>
        </SafeAreaView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.cardHandle} />

        <Text style={styles.cardTitle}>Location Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Latitude</Text>
          <Text style={styles.infoValue}>
            {latitude !== null ? latitude.toFixed(6) : '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Longitude</Text>
          <Text style={styles.infoValue}>
            {longitude !== null ? longitude.toFixed(6) : '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Distance from office</Text>
          <Text style={styles.infoValue}>
            {distanceMeters !== null
              ? formatDistance(distanceMeters)
              : '—'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBox,
            withinRange ? styles.statusBoxInRange : styles.statusBoxOutOfRange,
          ]}
        >
          <Text style={styles.statusLabel}>Attendance status</Text>
          <Text
            style={[
              styles.statusValue,
              withinRange ? styles.statusValueInRange : styles.statusValueOutOfRange,
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (isLoadingLocation || isRegistering || !withinRange) &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegisterAttendance}
          disabled={isLoadingLocation || isRegistering || !withinRange}
          activeOpacity={0.9}
        >
          {isRegistering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>
              Register Attendance
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapLoadingText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    marginBottom: 20,
  },
  statusBoxInRange: {
    backgroundColor: '#ECFDF5',
  },
  statusBoxOutOfRange: {
    backgroundColor: '#FEF2F2',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  statusValueInRange: {
    color: '#047857',
  },
  statusValueOutOfRange: {
    color: '#B91C1C',
  },
  registerButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  cameraTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraSubtitle: {
    fontSize: 15,
    color: '#F3F4F6',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraSpacer: {
    flex: 1,
  },
  captureButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  previewImageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  completeButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retakeButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
