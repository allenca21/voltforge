import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "../store";
import { C } from "../theme";

const PREVIEWS: Record<string, any> = {
  "Conduit Fill Calculator":       require("../../assets/images/preview-conduit.png"),
  "Conduit Bending Calculator":    require("../../assets/images/preview-bender.png"),
  "Wire Pull Tension Calculator":  require("../../assets/images/preview-pull.png"),
  "Transformer Wiring Diagrams":   require("../../assets/images/preview-transformer.png"),
  "NEC Quick Reference":           require("../../assets/images/preview-nec.png"),
  "Job Estimator & PDF Export":    require("../../assets/images/preview-estimate.png"),
};

export function ProGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { isPro } = useStore();
  const navigation = useNavigation<any>();
  if (isPro) return <>{children}</>;

  const preview = PREVIEWS[feature];
  const goToUpgrade = () => navigation.navigate("Upgrade");

  const content = (
    <>
      {/* Banner */}
      <View style={pg.banner}>
        <View style={pg.bannerLeft}>
          <Ionicons name="lock-closed" size={20} color={C.accent} style={{ marginRight:10 }}/>
          <View>
            <Text style={pg.bannerTitle}>Pro Feature</Text>
            <Text style={pg.bannerSub}>{feature}</Text>
          </View>
        </View>
      </View>

      {/* Hint — tappable */}
      <TouchableOpacity onPress={goToUpgrade} style={{ paddingHorizontal:24, paddingVertical:16 }}>
        <Text style={pg.hint}>
          Go to the{" "}
          <Text style={{ color:C.accent, fontWeight:"700" }}>Upgrade</Text>
          {" "}tab to unlock all Pro tools for a single{" "}
          <Text style={{ color:C.accent, fontWeight:"700" }}>$4.99</Text>
          {" "}one-time purchase. <Text style={{ color:C.accent }}>Tap here →</Text>
        </Text>
      </TouchableOpacity>

      {/* Preview screenshot — tappable */}
      {preview && (
        <TouchableOpacity style={pg.previewWrap} onPress={goToUpgrade} activeOpacity={0.85}>
          <Text style={pg.previewLabel}>TAP TO UNLOCK</Text>
          <Image
            source={preview}
            style={pg.previewImage}
            resizeMode="cover"
          />
          <View style={pg.previewOverlay}>
            <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.8)"/>
            <Text style={pg.previewOverlayText}>Tap to unlock all Pro tools — $4.99</Text>
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

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      {content}
    </View>
  );
}

const pg = StyleSheet.create({
  banner: {
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    backgroundColor:"#242424",
    borderBottomWidth:1,
    borderBottomColor:"#333",
    padding:16,
  },
  bannerLeft: {
    flexDirection:"row",
    alignItems:"center",
  },
  bannerTitle: {
    fontSize:15, fontWeight:"700", color:"#e0e0e0",
  },
  bannerSub: {
    fontSize:12, color:"#888", marginTop:2,
  },
  hint: {
    fontSize:14, color:"#888",
    textAlign:"center",
    lineHeight:22,
    paddingHorizontal:24,
    paddingVertical:16,
  },
  previewWrap: {
    marginHorizontal:16,
    borderRadius:12,
    overflow:"hidden",
    borderWidth:1,
    borderColor:"#333",
  },
  previewLabel: {
    fontSize:10,
    fontWeight:"700",
    color:C.accent,
    letterSpacing:1.5,
    paddingHorizontal:14,
    paddingVertical:8,
    backgroundColor:"#1e1e1e",
    borderBottomWidth:1,
    borderBottomColor:"#333",
  },
  previewImage: {
    width:"100%",
    height:450,
  },
  previewOverlay: {
    position:"absolute",
    bottom:0,
    left:0,
    right:0,
    height:120,
    backgroundColor:"rgba(0,0,0,0.65)",
    alignItems:"center",
    justifyContent:"center",
  },
  previewOverlayText: {
    color:"rgba(255,255,255,0.7)",
    fontSize:13,
    marginTop:6,
    fontWeight:"600",
  },
});
