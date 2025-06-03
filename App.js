import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  MD3LightTheme as DefaultTheme,
  List,
  PaperProvider,
  Switch,
  Text,
} from "react-native-paper";

import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

const db = SQLite.openDatabaseSync("locations.db");

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // Criação da tabela no banco
  useEffect(() => {
    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude TEXT NOT NULL,
          longitude TEXT NOT NULL
        );
      `);
    });
  }, []);

  // Carrega dark mode salvo
  async function loadDarkMode() {
    const value = await AsyncStorage.getItem("@darkMode");
    if (value === "true") {
      setIsSwitchOn(true);
    }
  }

  // Salva e alterna o dark mode
  async function onToggleSwitch() {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    await AsyncStorage.setItem("@darkMode", newValue.toString());
  }

  // Captura localização e salva no banco
  async function getLocation() {
    setIsLoading(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permissão negada para acessar a localização");
      setIsLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    db.runSync("INSERT INTO locations (latitude, longitude) VALUES (?, ?)", [
      latitude.toString(),
      longitude.toString(),
    ]);

    loadLocations();
    setIsLoading(false);
  }

  // Carrega localizações salvas do banco
  function loadLocations() {
    setIsLoading(true);
    const rows = db.getAllSync("SELECT * FROM locations", []);
    setLocations(rows);
    setIsLoading(false);
  }

  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  useEffect(() => {
    setTheme({
      ...theme,
      colors: isSwitchOn ? myColorsDark.colors : myColors.colors,
    });
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={getLocation}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            />
          )}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
