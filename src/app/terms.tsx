import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { C } from "@/theme";
import { Button, Card, ScreenHeader, Txt } from "@/components/ui";
import { SUPPORT } from "@/config";

// The full legal text lives on the website so it stays in one place.
export default function Terms() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Terms & Privacy" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Card style={{ gap: 10 }}>
          <Txt heading size={16}>Your data</Txt>
          <Txt size={13} color={C.body} lh={1.55}>We use your name, phone and email only to connect you with vendors you contact and to run your account. Vendors see the details you share in an enquiry.</Txt>
          <Txt heading size={16} style={{ marginTop: 6 }}>Using BharathBuild</Txt>
          <Txt size={13} color={C.body} lh={1.55}>Deals are made directly between buyers and vendors. Check credentials, quotes and agreements before paying.</Txt>
        </Card>
        <Button title="Read full Terms" variant="outline" onPress={() => Linking.openURL(`${SUPPORT.web}/terms`)} />
        <Button title="Read Privacy Policy" variant="outline" onPress={() => Linking.openURL(`${SUPPORT.web}/privacy`)} />
      </ScrollView>
    </View>
  );
}
