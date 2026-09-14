import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Switch, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";

const TOOLS = [
  { name:"OhmScreen",      label:"Ohm's Law",        sublabel:"& Voltage Drop",     icon:"flash",                pro:false },
  { name:"WireScreen",     label:"Wire Ampacity",     sublabel:"Table & Derating",   icon:"git-branch",           pro:false },
  { name:"FractionScreen", label:"Fraction",          sublabel:"Calculator",         icon:"calculator",           pro:false },
  { name:"ConduitScreen",  label:"Conduit Fill",      sublabel:"Calculator",         icon:"git-network",          pro:true  },
  { name:"BenderScreen",   label:"Conduit",           sublabel:"Bender",             icon:"repeat",               pro:true  },
  { name:"PullScreen",     label:"Wire Pull",         sublabel:"Tension",            icon:"arrow-forward-circle", pro:true  },
  { name:"XfmrScreen",     label:"Transformer",       sublabel:"Wiring Diagrams",    icon:"swap-horizontal",      pro:true  },
  { name:"NECScreen",      label:"NEC Quick",         sublabel:"Reference",          icon:"book",                 pro:true  },
  { name:"EstimateScreen", label:"Job Estimator",     sublabel:"& PDF Export",       icon:"document",             pro:true  },
  { name:"LoadCalcScreen",  label:"Load Calc",         sublabel:"NEC Article 220",    icon:"calculator",           pro:true  },
  { name:"UpgradeScreen",  label:"Upgrade",           sublabel:"to Pro",             icon:"star",                 pro:false },
];

export function HomeScreen() {
  const navigation  = useNavigation<any>();
  const { isPro, isDark, toggleTheme } = useStore();
  const C = isDark ? DARK : LIGHT;

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"}/>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>

        {/* ── Header ── */}
        <View style={{ alignItems:"center", paddingTop:20, paddingBottom:24 }}>
          <View style={{ flexDirection:"row", alignItems:"center", marginBottom:4 }}>
            <Ionicons name="flash" size={28} color={C.accent} style={{ marginRight:8 }}/>
            <Text style={{ fontSize:32, fontWeight:"900", color:C.accent, letterSpacing:1 }}>
              VoltForge
            </Text>
          </View>
          <Text style={{ fontSize:13, color:C.muted, letterSpacing:0.5 }}>
            Field Calculator & NEC Reference
          </Text>

          {/* ── Theme toggle ── */}
          <View style={{
            flexDirection:"row", alignItems:"center",
            marginTop:16, backgroundColor:C.card,
            borderRadius:20, paddingHorizontal:14, paddingVertical:8,
            borderWidth:1, borderColor:C.border, gap:10,
          }}>
            <Ionicons name="sunny" size={18} color={isDark ? C.muted : C.accent}/>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ddd", true: "#444" }}
              thumbColor={C.accent}
            />
            <Ionicons name="moon" size={18} color={isDark ? C.accent : C.muted}/>
          </View>
        </View>

        {/* ── Tool grid ── */}
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:12 }}>
          {TOOLS.map(tool => {
            const isLocked = tool.pro && !isPro;
            return (
              <TouchableOpacity
                key={tool.name}
                style={[hs.card, {
                  backgroundColor: C.card,
                  borderColor: tool.name === "UpgradeScreen" ? C.accent : C.border,
                  borderWidth: tool.name === "UpgradeScreen" ? 1.5 : 1,
                }]}
                onPress={() => navigation.navigate(tool.name)}
                activeOpacity={0.75}
              >
                {/* Lock badge */}
                {isLocked && (
                  <View style={hs.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color="#111"/>
                  </View>
                )}

                <View style={[hs.iconWrap, {
                  backgroundColor: tool.name === "UpgradeScreen" ? C.accent + "22" : isDark ? "#2a2a2a" : "#f0f0f0"
                }]}>
                  <Ionicons
                    name={tool.icon as any}
                    size={26}
                    color={tool.name === "UpgradeScreen" ? C.accent : isLocked ? C.muted : C.accent}
                  />
                </View>
                <Text style={[hs.toolLabel, { color: isLocked ? C.muted : C.text }]}>
                  {tool.label}
                </Text>
                <Text style={[hs.toolSublabel, { color:C.muted }]}>
                  {tool.sublabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Footer ── */}
        <Text style={{ color:C.muted, fontSize:10, textAlign:"center", marginTop:24, lineHeight:16 }}>
          VoltForge v1.0.2{"\n"}
          All calculations for planning purposes only.{"\n"}
          Always verify with your local AHJ.
        </Text>

      </ScrollView>
    </View>
  );
}

const hs = StyleSheet.create({
  card: {
    width:"47%",
    borderRadius:10,
    padding:14,
    alignItems:"center",
    position:"relative",
  },
  lockBadge: {
    position:"absolute",
    top:8, right:8,
    backgroundColor:"#f5a623",
    borderRadius:8,
    padding:3,
  },
  iconWrap: {
    borderRadius:12,
    padding:12,
    marginBottom:10,
  },
  toolLabel: {
    fontSize:13,
    fontWeight:"700",
    textAlign:"center",
    marginBottom:2,
  },
  toolSublabel: {
    fontSize:10,
    textAlign:"center",
  },
});
