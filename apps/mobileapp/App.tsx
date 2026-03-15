import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { sentinelAppName } from "@sentinel/config";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mobile shell</Text>
        <Text style={styles.title}>{sentinelAppName} Mobile</Text>
        <Text style={styles.body}>
          Thin Expo scaffold for future mobile intake, operator review, and safe field use.
        </Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Current intent</Text>
          <Text style={styles.panelBody}>
            Keep mobile valid, calm, and minimal until the first real mobile workflow is
            defined.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe5"
  },
  card: {
    flex: 1,
    margin: 24,
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#fbf8f2",
    shadowColor: "#17222f",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14
    },
    elevation: 5
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#465447",
    marginBottom: 12
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#17222f",
    marginBottom: 12
  },
  body: {
    fontSize: 16,
    lineHeight: 25,
    color: "#42515f"
  },
  panel: {
    marginTop: 24,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#f0e8d8"
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17222f",
    marginBottom: 8
  },
  panelBody: {
    fontSize: 15,
    lineHeight: 23,
    color: "#42515f"
  }
});
