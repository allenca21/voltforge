import React from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { s, C } from "../theme";

const PRO_FEATURES = [
  { icon:"git-network",          title:"Conduit Fill Calculator",      desc:"NEC-accurate fill, jam ratio & derating warnings"    },
  { icon:"repeat",               title:"Conduit Bender",               desc:"All 6 bend types with step-by-step marks"            },
  { icon:"arrow-forward-circle", title:"Wire Pull Tension Calculator",  desc:"Segment-by-segment pull tension & sidewall pressure" },
  { icon:"swap-horizontal",      title:"Transformer Wiring Diagrams",  desc:"7 configurations with SVG diagrams & field notes"    },
  { icon:"book",                 title:"NEC Quick Reference",          desc:"20 sections, searchable, always handy"               },
  { icon:"document",             title:"Job Estimator & PDF Export",   desc:"Markup, labor, permit, tax — share as PDF"           },
  { icon:"calculator",           title:"Load Calculator",              desc:"NEC Article 220 demand load with service sizing"     },
  { icon:"flash",                title:"All Future Pro Tools",         desc:"Every new tool we add, included free"                },
];

export function UpgradeScreen() {
  const { isPro, buyPro, restorePro } = useStore();

  const handleBuy = async () => {
    try {
      await buyPro();
    } catch {
      Alert.alert("Purchase Failed", "Could not complete purchase. Please try again.");
    }
  };

  const handleRestore = async () => {
    try {
      await restorePro();
      Alert.alert("Restored", "Your Pro purchase has been restored.");
    } catch {
      Alert.alert("Not Found", "No previous purchase found for this account.");
    }
  };

  if (isPro) {
    return (
      <ScrollView style={s.scroll} contentContainerStyle={{ alignItems:"center", paddingVertical:40, paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#1e1e1e", borderRadius:60, padding:24, marginBottom:24, borderWidth:2, borderColor:C.pass }}>
          <Ionicons name="checkmark-circle" size={56} color={C.pass}/>
        </View>
        <Text style={{ fontSize:26, fontWeight:"800", color:C.pass, marginBottom:8 }}>You're Pro!</Text>
        <Text style={{ fontSize:15, color:C.muted, textAlign:"center", lineHeight:22, marginBottom:32 }}>
          All tools are unlocked. Thanks for supporting VoltForge.
        </Text>
        <View style={[s.card, { width:"100%" }]}>
          <Text style={s.cardTitle}>Your Pro Tools</Text>
          {PRO_FEATURES.map(f => (
            <View key={f.title} style={{ flexDirection:"row", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#2a2a2a" }}>
              <Ionicons name={f.icon as any} size={18} color={C.pass} style={{ marginRight:12 }}/>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.text, fontSize:14, fontWeight:"700" }}>{f.title}</Text>
                <Text style={{ color:C.muted, fontSize:12, marginTop:2 }}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark" size={16} color={C.pass}/>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingVertical:24, paddingHorizontal:20 }}>

      {/* Hero */}
      <View style={{ alignItems:"center", marginBottom:28 }}>
        <View style={{ backgroundColor:"#1e1e1e", borderRadius:60, padding:20, marginBottom:16, borderWidth:2, borderColor:C.accent }}>
          <Ionicons name="flash" size={48} color={C.accent}/>
        </View>
        <Text style={{ fontSize:28, fontWeight:"900", color:C.text, textAlign:"center" }}>
          VoltForge
        </Text>
        <Text style={{ fontSize:18, fontWeight:"700", color:C.accent, marginTop:4 }}>Pro</Text>
        <Text style={{ fontSize:14, color:C.muted, textAlign:"center", marginTop:8, lineHeight:22 }}>
          One purchase. All tools. Forever.{"\n"}No subscription, no hidden fees.
        </Text>
      </View>

      {/* Feature list */}
      <View style={[s.card, { marginBottom:20 }]}>
        <Text style={s.cardTitle}>Everything in Pro</Text>
        {PRO_FEATURES.map((f, i) => (
          <View key={f.title} style={{
            flexDirection:"row", alignItems:"center",
            paddingVertical:12,
            borderBottomWidth: i < PRO_FEATURES.length - 1 ? 1 : 0,
            borderBottomColor:"#2a2a2a",
          }}>
            <View style={{ backgroundColor:"#2a1a00", borderRadius:8, padding:8, marginRight:14 }}>
              <Ionicons name={f.icon as any} size={20} color={C.accent}/>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.text, fontSize:14, fontWeight:"700" }}>{f.title}</Text>
              <Text style={{ color:C.muted, fontSize:12, marginTop:2, lineHeight:17 }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Price card */}
      <View style={{
        backgroundColor:"#1e1e1e", borderRadius:12, padding:20,
        alignItems:"center", marginBottom:16,
        borderWidth:1, borderColor:C.accent,
      }}>
        <Text style={{ fontSize:12, color:C.muted, fontWeight:"700", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
          One-Time Purchase
        </Text>
        <Text style={{ fontSize:52, fontWeight:"900", color:C.accent }}>$4.99</Text>
        <Text style={{ fontSize:13, color:C.muted, marginTop:4 }}>
          Unlocks all current and future Pro tools
        </Text>
      </View>

      {/* Buy button */}
      <TouchableOpacity style={[s.btn, { paddingVertical:16, marginBottom:12 }]} onPress={handleBuy}>
        <Text style={[s.btnText, { fontSize:17 }]}>Unlock Pro — $4.99</Text>
      </TouchableOpacity>

      {/* Restore */}
      <TouchableOpacity onPress={handleRestore} style={{ alignItems:"center", padding:12, marginBottom:8 }}>
        <Text style={{ color:C.muted, fontSize:13, textDecorationLine:"underline" }}>
          Restore Previous Purchase
        </Text>
      </TouchableOpacity>

      <Text style={[s.infoText, { textAlign:"center", marginBottom:20 }]}>
        Payment charged to your Apple ID. No subscription — this is a one-time purchase.
      </Text>

    </ScrollView>
  );
}
