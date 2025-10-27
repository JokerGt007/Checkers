import React from "react";
import { StyleSheet, View } from "react-native";
import DamiumMenu from './components/DamiumMenu';

export default function Index() {
  return (
    <View style={styles.container}>
      <DamiumMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
});
