import { StatusBar } from "expo-status-bar";
import { SafeAreaView, Text, View } from "react-native";
import { sentinelAppName } from "@sentinel/config";
import { styles } from "./src/mobileStyles";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mobile channel</Text>
        <Text style={styles.title}>{sentinelAppName} Mobile</Text>
        <Text style={styles.body}>
          Mobile is reserved for intake, review, and field checks once source workflows are active.
        </Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Current intent</Text>
          <Text style={styles.panelBody}>
            Desktop and web remain the primary review channels while mobile focuses on field-ready checks.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
