import React from "react";
import { StyleSheet, View } from "react-native";
import DamiumMenu from '../DamiumMenu.jsx';


export default function Index() {
  return (
    <View style={styles.container}>
      <DamiumMenu />
    </View>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
});
