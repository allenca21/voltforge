import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";

const PREVIEWS: Record<string, any> = {
  "Conduit Fill Calculator":       require("../../assets/images/preview-conduit.png"),
  "Conduit Bending Calculator":    require("../../assets/images/preview-bender.png"),
  "Wire Pull Tension Calculator":  require("../../assets/images/preview-pull.png"),
  "Transformer Wiring Diagrams":   require("../../assets/images/preview-transformer.png"),
  "NEC Quick Reference":           require("../../assets/images/preview-nec.png"),
  "Job Estimator & PDF Export":    require("../../assets/images/preview-estimate.png"),
};

export function ProGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { isPro, isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const navigation = useNavigation<any>();
  if (isPro) return <>{children}</>;

  const preview = PREVIEWS[feature];
  const goToUpgrade = () => navigation.navigate("UpgradeScreen");

  const content = (
    <>
      <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:C.card,
        borderBottomWidth:1, borderBottomColor:C.border, padding:16 }}>
        <Ionicons name="lock-closed" size={20} color={C.accent} style={{ marginRight:10 }}/>
        <View>
          <Text style={{ fontSize:15, fontWeight:"700", color:C.text }}>Pro Feature</Text>
          <Text style={{ fontSize:12, color:C.muted, marginTop:2 }}>{feature}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={goToUpgrade} style={{ paddingHorizontal:24, paddingVertical:16 }}>
        <Text style={{ fontSize:14, color:C.muted, textAlign:"center", lineHeight:22 }}>
          Go to the <Text style={{ color:C.accent, fontWeight:"700" }}>Upgrade</Text> tab to unlock all Pro tools for a single <Text style={{ color:C.accent, fontWeight:"700" }}>$4.99</Text> one-time purchase. <Text style={{ color:C.accent }}>Tap here →</Text>
        </Text>
      </TouchableOpacity>

      {preview && (
        <TouchableOpacity style={{ marginHorizontal:16, borderRadius:12, overflow:"hidden", borderWidth:1, borderColor:C.border }} onPress={goToUpgrade} activeOpacity={0.85}>
          <Text style={{ fontSize:10, fontWeight:"700", color:C.accent, letterSpacing:1.5, paddingHorizontal:14, paddingVertical:8, backgroundColor:C.card, borderBottomWidth:1, borderBottomColor:C.border }}>TAP TO UNLOCK</Text>
          <Image source={preview} style={{ width:"100%", height:340 }} resizeMode="cover"/>
          <View style={{ position:"absolute", bottom:0, left:0, right:0, height:120, backgroundColor:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center" }}>
            <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.8)"/>
            <Text style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:6, fontWeight:"600" }}>Tap to unlock all Pro tools — $4.99</Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );

  if (preview) {
    return (
      <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ paddingBottom:30 }}>
        {content}
      </ScrollView>
    );
  }

  return <View style={{ flex:1, backgroundColor:C.bg }}>{content}</View>;
}
