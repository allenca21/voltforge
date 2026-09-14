import React, { useState, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Alert, Modal, Image
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

// ─── Types ─────────────────────────────────────────────────────
type Phase = "1ph" | "3ph";
type Category =
  | "general_lighting"
  | "small_appliance"
  | "hvac"
  | "electric_cooking"
  | "motor"
  | "dryer"
  | "general";

type LoadItem = {
  id: string;
  name: string;
  category: Category;
  inputType: "amps" | "watts";
  amps: string;
  watts: string;
  voltage: string;
  phase: Phase;
  qty: string;
  photoUri?: string;
};

type Job = {
  id: string;
  name: string;
  items: LoadItem[];
  createdAt: string;
};

// ─── NEC Demand Factor Logic ───────────────────────────────────
const CATEGORY_LABELS: Record<Category, string> = {
  general_lighting: "General Lighting",
  small_appliance:  "Small Appliance",
  hvac:             "HVAC / Motor",
  electric_cooking: "Electric Cooking",
  motor:            "Motor Load",
  dryer:            "Electric Dryer",
  general:          "General Load",
};

const CATEGORY_ICONS: Record<Category, string> = {
  general_lighting: "bulb",
  small_appliance:  "flash",
  hvac:             "thermometer",
  electric_cooking: "flame",
  motor:            "settings",
  dryer:            "shirt",
  general:          "grid",
};

function calcVA(item: LoadItem): number {
  const qty = parseInt(item.qty) || 1;
  if (item.inputType === "amps") {
    const a = parseFloat(item.amps) || 0;
    const v = parseFloat(item.voltage) || 120;
    const factor = item.phase === "3ph" ? 1.732 : 1;
    return a * v * factor * qty;
  } else {
    return (parseFloat(item.watts) || 0) * qty;
  }
}

function applyDemandFactor(category: Category, totalVA: number): number {
  switch (category) {
    case "general_lighting": {
      // NEC 220.42: first 3000VA @ 100%, 3001-120000 @ 35%, over 120000 @ 25%
      if (totalVA <= 3000) return totalVA;
      if (totalVA <= 120000) return 3000 + (totalVA - 3000) * 0.35;
      return 3000 + 117000 * 0.35 + (totalVA - 120000) * 0.25;
    }
    case "small_appliance":
      // NEC 220.52: 1500VA per circuit, demand factor same as lighting
      if (totalVA <= 3000) return totalVA;
      return 3000 + (totalVA - 3000) * 0.35;
    case "hvac":
      // NEC 220.60: use largest only (caller handles multi-item)
      return totalVA * 1.0;
    case "electric_cooking": {
      // NEC 220.55 simplified: demand factor based on number of units
      // Using Table 220.55 Column C approximation
      return totalVA * 0.80;
    }
    case "motor":
      // NEC 430.24: largest motor @ 125%, others @ 100%
      return totalVA * 1.0; // simplified — user should verify
    case "dryer":
      // NEC 220.54: 5000W or nameplate whichever is larger, 100% demand
      return totalVA * 1.0;
    case "general":
      return totalVA * 1.0;
    default:
      return totalVA;
  }
}

// ─── New Item defaults ─────────────────────────────────────────
const newItem = (): LoadItem => ({
  id: Date.now().toString(),
  name: "",
  category: "general",
  inputType: "amps",
  amps: "",
  watts: "",
  voltage: "120",
  phase: "1ph",
  qty: "1",
});

const VOLTAGES_1PH = ["120", "208", "240", "277"];
const VOLTAGES_3PH = ["208", "240", "277", "480"];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const STORAGE_KEY = "voltforge_load_jobs";

// ─── Main Component ────────────────────────────────────────────
function LoadCalcInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);

  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [newJobName,  setNewJobName]  = useState("");
  const [showNewJob,  setShowNewJob]  = useState(false);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [photoItem,   setPhotoItem]   = useState<string | null>(null);

  const activeJob = jobs.find(j => j.id === activeJobId) ?? null;

  // Load saved jobs
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        const parsed: Job[] = JSON.parse(raw);
        setJobs(parsed);
        if (parsed.length > 0) setActiveJobId(parsed[0].id);
      }
    });
  }, []);

  const saveJobs = async (updated: Job[]) => {
    setJobs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createJob = () => {
    if (!newJobName.trim()) return;
    const job: Job = {
      id: Date.now().toString(),
      name: newJobName.trim(),
      items: [newItem()],
      createdAt: new Date().toISOString(),
    };
    const updated = [...jobs, job];
    saveJobs(updated);
    setActiveJobId(job.id);
    setNewJobName("");
    setShowNewJob(false);
  };

  const deleteJob = (id: string) => {
    Alert.alert("Delete Job", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        const updated = jobs.filter(j => j.id !== id);
        saveJobs(updated);
        setActiveJobId(updated.length > 0 ? updated[0].id : null);
        setShowJobPicker(false);
      }},
    ]);
  };

  const updateItems = (items: LoadItem[]) => {
    if (!activeJob) return;
    const updated = jobs.map(j => j.id === activeJob.id ? { ...j, items } : j);
    saveJobs(updated);
  };

  const addItem = () => {
    if (!activeJob) return;
    updateItems([...activeJob.items, newItem()]);
  };

  const removeItem = (id: string) => {
    if (!activeJob) return;
    updateItems(activeJob.items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, key: keyof LoadItem, val: any) => {
    if (!activeJob) return;
    updateItems(activeJob.items.map(i => i.id === id ? { ...i, [key]: val } : i));
  };

  const pickPhoto = async (itemId: string) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      updateItem(itemId, "photoUri", result.assets[0].uri);
    }
  };

  // ─── Calculations ──────────────────────────────────────────
  const items1ph = activeJob?.items.filter(i => i.phase === "1ph") ?? [];
  const items3ph = activeJob?.items.filter(i => i.phase === "3ph") ?? [];

  // Group by category and apply demand factors
  const calcDemand = (items: LoadItem[]) => {
    const byCategory: Record<string, LoadItem[]> = {};
    items.forEach(item => {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    });

    let totalDemandVA = 0;
    const breakdown: Array<{ category: Category; rawVA: number; demandVA: number }> = [];

    Object.entries(byCategory).forEach(([cat, catItems]) => {
      const rawVA = catItems.reduce((sum, i) => sum + calcVA(i), 0);
      const demandVA = applyDemandFactor(cat as Category, rawVA);
      totalDemandVA += demandVA;
      breakdown.push({ category: cat as Category, rawVA, demandVA });
    });

    return { totalDemandVA, breakdown };
  };

  const result1ph = calcDemand(items1ph);
  const result3ph = calcDemand(items3ph);

  const totalAmps1ph = result1ph.totalDemandVA / 120;
  const totalAmps3ph = result3ph.totalDemandVA / (208 * 1.732);
  const totalCombinedVA = result1ph.totalDemandVA + result3ph.totalDemandVA;

  // Recommended service size
  const recommendService = (amps: number) => {
    const sizes = [100, 125, 150, 200, 225, 300, 400, 600, 800, 1000];
    return sizes.find(s => s >= amps * 1.25) ?? 1000;
  };

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* ── Job selector ── */}
      <View style={s.card}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={s.cardTitle}>Current Job</Text>
          <TouchableOpacity onPress={() => setShowNewJob(true)} style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
            <Ionicons name="add-circle" size={18} color={C.accent}/>
            <Text style={{ color:C.accent, fontSize:12, fontWeight:"700" }}>New Job</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ backgroundColor:C.input, borderRadius:6, padding:12, borderWidth:1, borderColor:C.border, flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}
          onPress={() => setShowJobPicker(true)}
        >
          <Text style={{ color: activeJob ? C.text : C.muted, fontSize:15, fontWeight:activeJob?"700":"400" }}>
            {activeJob?.name ?? "Select or create a job"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={C.muted}/>
        </TouchableOpacity>
      </View>

      {/* ── Job picker modal ── */}
      <Modal visible={showJobPicker} transparent animationType="fade" onRequestClose={() => setShowJobPicker(false)}>
        <TouchableOpacity style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", padding:24 }} activeOpacity={1} onPress={() => setShowJobPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor:C.card, borderRadius:12, padding:20, borderWidth:1, borderColor:C.border }}>
            <Text style={[s.cardTitle, { marginBottom:16 }]}>Select Job</Text>
            {jobs.length === 0 && <Text style={{ color:C.muted, textAlign:"center", marginBottom:12 }}>No jobs yet — create one above</Text>}
            {jobs.map(job => (
              <View key={job.id} style={{ flexDirection:"row", alignItems:"center", marginBottom:10 }}>
                <TouchableOpacity
                  style={{ flex:1, backgroundColor: job.id === activeJobId ? C.accent+"22" : C.input, borderRadius:6, padding:12, borderWidth:1, borderColor: job.id === activeJobId ? C.accent : C.border }}
                  onPress={() => { setActiveJobId(job.id); setShowJobPicker(false); }}
                >
                  <Text style={{ color: job.id === activeJobId ? C.accent : C.text, fontWeight:"700" }}>{job.name}</Text>
                  <Text style={{ color:C.muted, fontSize:11, marginTop:2 }}>{job.items.length} items</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft:8, padding:8 }} onPress={() => deleteJob(job.id)}>
                  <Ionicons name="trash" size={18} color={C.fail}/>
                </TouchableOpacity>
              </View>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── New job modal ── */}
      <Modal visible={showNewJob} transparent animationType="fade" onRequestClose={() => setShowNewJob(false)}>
        <TouchableOpacity style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", padding:24 }} activeOpacity={1} onPress={() => setShowNewJob(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor:C.card, borderRadius:12, padding:20, borderWidth:1, borderColor:C.border }}>
            <Text style={[s.cardTitle, { marginBottom:12 }]}>New Job</Text>
            <TextInput
              style={s.input}
              value={newJobName}
              onChangeText={setNewJobName}
              placeholder="e.g. Main Street Bakery"
              placeholderTextColor={C.muted}
              autoFocus
            />
            <TouchableOpacity style={s.btn} onPress={createJob}>
              <Text style={s.btnText}>Create Job</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Load items ── */}
      {activeJob && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Load Items — {activeJob.name}</Text>

          {activeJob.items.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const itemVA = calcVA(item);
            const itemAmps = item.phase === "3ph"
              ? itemVA / ((parseFloat(item.voltage) || 208) * 1.732)
              : itemVA / (parseFloat(item.voltage) || 120);

            return (
              <View key={item.id} style={{ backgroundColor:C.input, borderRadius:8, borderWidth:1, borderColor:C.border, marginBottom:10, overflow:"hidden" }}>

                {/* Item header */}
                <TouchableOpacity
                  style={{ flexDirection:"row", alignItems:"center", padding:12, gap:10 }}
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <Ionicons name={CATEGORY_ICONS[item.category] as any} size={18} color={C.accent}/>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: item.name ? C.text : C.muted, fontSize:13, fontWeight:"700" }}>
                      {item.name || `Item ${idx + 1}`}
                    </Text>
                    <Text style={{ color:C.muted, fontSize:11, marginTop:1 }}>
                      {CATEGORY_LABELS[item.category]} • {item.phase === "3ph" ? "3-Phase" : "1-Phase"} • {itemVA > 0 ? `${itemAmps.toFixed(1)}A` : "—"}
                    </Text>
                  </View>
                  {item.photoUri && <Ionicons name="camera" size={14} color={C.accent}/>}
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={{ padding:4 }}>
                    <Ionicons name="close-circle" size={18} color={C.fail}/>
                  </TouchableOpacity>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={C.muted}/>
                </TouchableOpacity>

                {/* Expanded detail */}
                {isExpanded && (
                  <View style={{ padding:12, borderTopWidth:1, borderTopColor:C.border }}>

                    {/* Name */}
                    <Text style={s.label}>Device / Equipment Name</Text>
                    <TextInput style={s.input} value={item.name} onChangeText={v => updateItem(item.id, "name", v)} placeholder="e.g. Walk-in Cooler Compressor" placeholderTextColor={C.muted}/>

                    {/* Category */}
                    <Text style={s.label}>Category (NEC Demand Factor)</Text>
                    <View style={[s.selectRow, { marginBottom:12 }]}>
                      {CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={[s.sfBtn, { minWidth:90 }, item.category === cat && s.sfBtnActive]}
                          onPress={() => updateItem(item.id, "category", cat)}
                        >
                          <Text style={[s.sfBtnText, { fontSize:10 }, item.category === cat && s.sfBtnTextActive]}>
                            {CATEGORY_LABELS[cat]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Phase */}
                    <Text style={s.label}>Phase</Text>
                    <View style={[s.selectRow, { marginBottom:12 }]}>
                      {(["1ph", "3ph"] as Phase[]).map(p => (
                        <TouchableOpacity key={p} style={[s.sfBtn, { flex:1 }, item.phase === p && s.sfBtnActive]} onPress={() => updateItem(item.id, "phase", p)}>
                          <Text style={[s.sfBtnText, item.phase === p && s.sfBtnTextActive]}>{p === "1ph" ? "1-Phase" : "3-Phase"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Input type */}
                    <Text style={s.label}>Input Type</Text>
                    <View style={[s.selectRow, { marginBottom:12 }]}>
                      {(["amps", "watts"] as const).map(t => (
                        <TouchableOpacity key={t} style={[s.sfBtn, { flex:1 }, item.inputType === t && s.sfBtnActive]} onPress={() => updateItem(item.id, "inputType", t)}>
                          <Text style={[s.sfBtnText, item.inputType === t && s.sfBtnTextActive]}>{t === "amps" ? "Amps (A)" : "Watts (W)"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Value inputs */}
                    <View style={s.row}>
                      <View style={s.flex1}>
                        <Text style={s.label}>{item.inputType === "amps" ? "Amps (A)" : "Watts (W)"}</Text>
                        {item.inputType === "amps" ? (
                          <TextInput style={s.input} keyboardType="decimal-pad" value={item.amps} onChangeText={v => updateItem(item.id, "amps", v)} placeholder="0" placeholderTextColor={C.muted}/>
                        ) : (
                          <TextInput style={s.input} keyboardType="decimal-pad" value={item.watts} onChangeText={v => updateItem(item.id, "watts", v)} placeholder="0" placeholderTextColor={C.muted}/>
                        )}
                      </View>
                      <View style={s.flex1}>
                        <Text style={s.label}>Qty</Text>
                        <TextInput style={s.input} keyboardType="number-pad" value={item.qty} onChangeText={v => updateItem(item.id, "qty", v)} placeholder="1" placeholderTextColor={C.muted}/>
                      </View>
                    </View>

                    {/* Voltage (only shown for amps input) */}
                    {item.inputType === "amps" && (
                      <>
                        <Text style={s.label}>Voltage</Text>
                        <View style={[s.selectRow, { marginBottom:12 }]}>
                          {(item.phase === "3ph" ? VOLTAGES_3PH : VOLTAGES_1PH).map(v => (
                            <TouchableOpacity key={v} style={[s.sfBtn, item.voltage === v && s.sfBtnActive]} onPress={() => updateItem(item.id, "voltage", v)}>
                              <Text style={[s.sfBtnText, item.voltage === v && s.sfBtnTextActive]}>{v}V</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    {/* Calculated result */}
                    {itemVA > 0 && (
                      <View style={{ backgroundColor:C.card, borderRadius:6, padding:10, borderWidth:1, borderColor:C.accent, marginBottom:12 }}>
                        <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                          <Text style={{ color:C.muted, fontSize:12 }}>Total VA</Text>
                          <Text style={{ color:C.accent, fontWeight:"700", fontSize:12 }}>{itemVA.toFixed(0)} VA</Text>
                        </View>
                        <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:4 }}>
                          <Text style={{ color:C.muted, fontSize:12 }}>Total Amps</Text>
                          <Text style={{ color:C.accent, fontWeight:"700", fontSize:12 }}>{itemAmps.toFixed(2)} A</Text>
                        </View>
                      </View>
                    )}

                    {/* Photo */}
                    <TouchableOpacity
                      style={[s.btn, s.btnOutline, { marginBottom: item.photoUri ? 10 : 0 }]}
                      onPress={() => pickPhoto(item.id)}
                    >
                      <Text style={s.btnOutlineText}>
                        {item.photoUri ? "Retake Nameplate Photo" : "📷  Add Nameplate Photo"}
                      </Text>
                    </TouchableOpacity>
                    {item.photoUri && (
                      <TouchableOpacity onPress={() => setPhotoItem(item.photoUri!)}>
                        <Image source={{ uri: item.photoUri }} style={{ width:"100%", height:160, borderRadius:6, marginTop:6 }} resizeMode="cover"/>
                        <Text style={{ color:C.muted, fontSize:10, textAlign:"center", marginTop:4 }}>Tap to view full size</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={[s.btn, s.btnOutline, { marginTop:8 }]} onPress={addItem}>
            <Text style={s.btnOutlineText}>+ Add Load Item</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Results ── */}
      {activeJob && activeJob.items.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Load Summary — {activeJob.name}</Text>

          {/* 1-Phase summary */}
          {items1ph.length > 0 && (
            <>
              <Text style={{ color:C.accent, fontWeight:"700", fontSize:12, marginBottom:8, textTransform:"uppercase", letterSpacing:0.8 }}>Single Phase Loads</Text>
              {result1ph.breakdown.map(({ category, rawVA, demandVA }) => (
                <View key={category} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:5, borderBottomWidth:1, borderBottomColor:C.border }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                    <Ionicons name={CATEGORY_ICONS[category] as any} size={14} color={C.muted}/>
                    <Text style={{ color:C.text, fontSize:12 }}>{CATEGORY_LABELS[category]}</Text>
                  </View>
                  <View style={{ alignItems:"flex-end" }}>
                    <Text style={{ color:C.accent, fontWeight:"700", fontSize:12 }}>{(demandVA/120).toFixed(1)}A</Text>
                    {rawVA !== demandVA && <Text style={{ color:C.muted, fontSize:10 }}>({(rawVA/120).toFixed(1)}A before demand)</Text>}
                  </View>
                </View>
              ))}
              <View style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:8, borderBottomWidth:2, borderBottomColor:C.accent, marginBottom:12 }}>
                <Text style={{ color:C.text, fontWeight:"700" }}>1-Phase Total</Text>
                <Text style={{ color:C.accent, fontWeight:"700", fontSize:15 }}>{totalAmps1ph.toFixed(1)} A @ 120V</Text>
              </View>
            </>
          )}

          {/* 3-Phase summary */}
          {items3ph.length > 0 && (
            <>
              <Text style={{ color:C.accent, fontWeight:"700", fontSize:12, marginBottom:8, textTransform:"uppercase", letterSpacing:0.8 }}>Three Phase Loads</Text>
              {result3ph.breakdown.map(({ category, rawVA, demandVA }) => (
                <View key={category} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:5, borderBottomWidth:1, borderBottomColor:C.border }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                    <Ionicons name={CATEGORY_ICONS[category] as any} size={14} color={C.muted}/>
                    <Text style={{ color:C.text, fontSize:12 }}>{CATEGORY_LABELS[category]}</Text>
                  </View>
                  <View style={{ alignItems:"flex-end" }}>
                    <Text style={{ color:C.accent, fontWeight:"700", fontSize:12 }}>{(demandVA/(208*1.732)).toFixed(1)}A</Text>
                    {rawVA !== demandVA && <Text style={{ color:C.muted, fontSize:10 }}>({(rawVA/(208*1.732)).toFixed(1)}A before demand)</Text>}
                  </View>
                </View>
              ))}
              <View style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:8, borderBottomWidth:2, borderBottomColor:C.accent, marginBottom:12 }}>
                <Text style={{ color:C.text, fontWeight:"700" }}>3-Phase Total</Text>
                <Text style={{ color:C.accent, fontWeight:"700", fontSize:15 }}>{totalAmps3ph.toFixed(1)} A @ 208V 3Ø</Text>
              </View>
            </>
          )}

          {/* Combined total */}
          <View style={{ backgroundColor:C.input, borderRadius:8, padding:14, borderWidth:1, borderColor:C.accent }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
              <Text style={{ color:C.muted, fontSize:13 }}>Total Demand Load</Text>
              <Text style={{ color:C.accent, fontWeight:"700", fontSize:13 }}>{(totalCombinedVA/1000).toFixed(2)} kVA</Text>
            </View>
            {items1ph.length > 0 && (
              <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
                <Text style={{ color:C.muted, fontSize:13 }}>Recommended 1-Phase Service</Text>
                <Text style={{ color:C.pass, fontWeight:"700", fontSize:13 }}>{recommendService(totalAmps1ph)}A</Text>
              </View>
            )}
            {items3ph.length > 0 && (
              <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                <Text style={{ color:C.muted, fontSize:13 }}>Recommended 3-Phase Service</Text>
                <Text style={{ color:C.pass, fontWeight:"700", fontSize:13 }}>{recommendService(totalAmps3ph)}A</Text>
              </View>
            )}
          </View>

          <Text style={[s.infoText, { marginTop:10 }]}>
            NEC demand factors applied per Article 220. Recommended service = calculated load × 125% per NEC 230.79. Always verify with your local AHJ.
          </Text>
        </View>
      )}

      {/* ── Photo full view modal ── */}
      <Modal visible={!!photoItem} transparent animationType="fade" onRequestClose={() => setPhotoItem(null)}>
        <TouchableOpacity style={{ flex:1, backgroundColor:"rgba(0,0,0,0.9)", justifyContent:"center", padding:20 }} onPress={() => setPhotoItem(null)}>
          {photoItem && <Image source={{ uri: photoItem }} style={{ width:"100%", height:400, borderRadius:8 }} resizeMode="contain"/>}
          <Text style={{ color:"#fff", textAlign:"center", marginTop:12, fontSize:13 }}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

export function LoadCalcScreen() {
  return <ProGate feature="Load Calculator"><LoadCalcInner/></ProGate>;
}
