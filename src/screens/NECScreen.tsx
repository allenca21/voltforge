import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, TextInput } from "react-native";
import { useStore } from "../store";
import { DARK, LIGHT } from "../theme";
import { makeStyles } from "../styles";
import { ProGate } from "../components/ProGate";

const necData = [
  {
    title: "Working Clearances — 110.26",
    items: [
      "Condition 1 (exposed/grounded): 0–150V=3ft, 151–600V=3.5ft",
      "Condition 2 (exposed on one side): 0–150V=3ft, 151–600V=4ft",
      "Condition 3 (exposed on both sides): 0–150V=3ft, 151–600V=5ft",
      "Width of working space: min 30\" or width of equipment (whichever is greater)",
      "Height of working space: min 6.5ft from floor or to top of equipment",
      "Dedicated electrical space: equipment width × depth to structural ceiling",
      "Clear space must be maintained — storage is prohibited in front of panels",
      "Illumination required in all working spaces around service equipment and panelboards",
      "Two entrances/exits required for rooms with equipment rated 1200A or more and over 6ft wide",
    ],
  },
  {
    title: "Box Fill — 314.16",
    items: [
      "Each conductor counts as 1 volume allowance for its AWG size",
      "14 AWG: 2.00 cu in  |  12 AWG: 2.25 cu in  |  10 AWG: 2.50 cu in",
      "8 AWG: 3.00 cu in  |  6 AWG: 5.00 cu in",
      "Devices (switches / receptacles): 2× the largest conductor connected to the device",
      "Internal cable clamps: 1× largest conductor in the box",
      "Equipment grounding conductors: 1× the largest EGC in the box (all EGCs count as one)",
      "Luminaire studs / hickeys: 1× largest conductor each",
      "Conductors passing through without splice or termination count as 1 each",
    ],
  },
  {
    title: "Receptacle Spacing — 210.52",
    items: [
      "Dwelling unit wall rule: no point along wall more than 6ft from a receptacle",
      "Receptacles spaced not more than 12ft apart along wall space",
      "Wall space includes any space 2ft or more wide",
      "Countertop receptacles: within 2ft of the end of each countertop section",
      "Island/peninsula countertops: at least 1 receptacle for every 9 sq ft of surface",
      "Bathroom: at least 1 receptacle within 3ft of each sink basin",
      "Outdoor: at least 1 at front and 1 at back of dwelling (accessible from grade)",
      "Garage: at least 1 per car space, plus 1 for each additional enclosed space",
      "Hallways 10ft or more in length: at least 1 receptacle required",
      "Unfinished basement: at least 1 receptacle",
      "Laundry area: at least 1 receptacle dedicated to laundry",
    ],
  },
  {
    title: "Kitchen & Bathroom Circuits — 210.11 / 210.52",
    items: [
      "Minimum 2 small appliance branch circuits (20A) required for kitchen countertops",
      "Small appliance circuits must serve only kitchen, dining, pantry, and breakfast areas",
      "Refrigerator may be on a dedicated 15A or 20A circuit",
      "Dishwasher: dedicated 20A circuit recommended (required by many AHJs)",
      "Garbage disposal: dedicated 20A circuit",
      "Microwave above range: dedicated 20A circuit",
      "Bathroom: at least 1 dedicated 20A circuit for receptacles (may serve multiple bathrooms)",
      "Bathroom lighting/fans may NOT be on the 20A receptacle circuit",
      "GFCI protection required for all bathroom receptacles",
    ],
  },
  {
    title: "GFCI Requirements — 210.8",
    items: [
      "Required in: bathrooms, garages, outdoors, crawl spaces, unfinished basements",
      "Kitchens: all receptacles serving countertop surfaces within 6ft of a sink",
      "Boathouses, pool/spa equipment, rooftops, boat hoisting areas",
      "Unfinished accessory buildings at or below grade",
      "Applies to 15A and 20A, 125V through 250V single-phase receptacles",
      "GFCI protection can be provided by a GFCI breaker, GFCI receptacle, or GFCI deadface",
      "Replacement receptacles in GFCI locations must be GFCI protected even if no ground exists",
    ],
  },
  {
    title: "AFCI Requirements — 210.12",
    items: [
      "Required on all 120V, 15A and 20A branch circuits supplying outlets in dwelling units:",
      "Bedrooms, living rooms, parlors, libraries, dens, sunrooms, recreation rooms",
      "Closets, hallways, laundry areas, and similar rooms or areas",
      "A listed dual-function AFCI/GFCI device satisfies both requirements where both apply",
      "AFCI protection can be at the panel (breaker) or at the first outlet",
      "Extensions/modifications to existing circuits also require AFCI protection",
    ],
  },
  {
    title: "Breaker & Conductor Sizing — 240.4",
    items: [
      "Continuous load rule: OCPD must be rated ≥ 125% of continuous load + 100% non-continuous",
      "15A circuit → minimum 14 AWG Cu",
      "20A circuit → minimum 12 AWG Cu",
      "30A circuit → minimum 10 AWG Cu",
      "40A circuit → minimum 8 AWG Cu",
      "60A circuit → minimum 6 AWG Cu  (or 4 AWG Al)",
      "100A circuit → minimum 2 AWG Cu  (or 1/0 AWG Al)",
      "200A circuit → minimum 3/0 AWG Cu  (or 350 kcmil Al)",
      "10-ft tap rule: tap conductor ≥ 10% of upstream OCPD rating, routed in raceway",
      "25-ft tap rule: tap conductor ≥ ⅓ of upstream OCPD rating, routed in raceway",
      "Outside tap rule: no length limit if outdoors, terminated in single OCPD",
    ],
  },
  {
    title: "Feeder Sizing — 215.2",
    items: [
      "Feeder ampacity must be ≥ calculated load per Article 220",
      "Minimum feeder size: 100A for dwelling units with 6+ 2-wire branch circuits",
      "Feeder neutral: sized for maximum unbalanced load (may be reduced per 220.61)",
      "Neutral reduction not permitted where nonlinear loads exceed 50% of load",
      "Feeder taps: follow 10-ft, 25-ft, or outside tap rules per 240.21",
      "Subfeed lugs and subfeed breakers must match panelboard ratings",
      "Always include voltage drop in long feeder runs — NEC recommends ≤3%",
    ],
  },
  {
    title: "Voltage Drop Reference",
    items: [
      "NEC recommends: branch circuits ≤3%, feeders ≤3%, combined ≤5%",
      "Formula: VD = (2 × K × I × L) / CM",
      "K = 12.9 for copper, 21.2 for aluminum",
      "I = current (amps), L = one-way length (ft), CM = circular mils of conductor",
      "Circular mils: 14AWG=4110, 12AWG=6530, 10AWG=10380, 8AWG=16510",
      "Circular mils: 6AWG=26240, 4AWG=41740, 2AWG=66360, 1/0=105600",
      "Simplified: for 120V/20A circuit, max run on 12AWG ≈ 50ft at 3%",
      "Use larger conductors or higher voltage to reduce voltage drop on long runs",
    ],
  },
  {
    title: "Panelboard Rules — Article 408",
    items: [
      "Maximum 42 overcurrent devices in a single panelboard (42-circuit rule)",
      "Circuit directory must be legible and accurate — required by 408.4",
      "Neutral bar must be isolated from enclosure in subpanels (separate ground bar required)",
      "Main bonding jumper: installed only at service equipment, NOT at subpanels",
      "Separate neutral and ground bars required in all subpanels",
      "Panelboard must be rated for available fault current (AIC rating)",
      "Unused openings must be closed with listed fillers",
      "Panelboards must be marked with voltage and current rating",
    ],
  },
  {
    title: "Grounding & Bonding — Article 250",
    items: [
      "GEC size: determined by the largest service entrance conductor (Table 250.66)",
      "Main bonding jumper: connects the neutral (grounded) conductor to the enclosure at service equipment",
      "System bonding jumper: used at separately derived systems (transformers, generators)",
      "Equipment grounding: must provide a continuous low-impedance path back to the source",
      "Ground rods: minimum 8 ft in contact with earth",
      "Two ground rods required if a single rod has resistance > 25Ω",
      "Bonding jumpers required at all metallic raceways and enclosures at service entrance",
      "Isolated grounding: permitted for sensitive electronic equipment per 250.96(B)",
      "Bonding required for all metal water piping within 5ft of entry to building",
      "Structural steel: must be bonded if used as part of grounding electrode system",
    ],
  },
  {
    title: "Service Entrance — Article 230",
    items: [
      "Minimum service size for a single-family dwelling: 100A (230.79(C))",
      "Maximum number of service disconnects: 6 (230.71)",
      "Service drop clearance: 10 ft above finished grade at the point of attachment",
      "Service drop over residential driveways: minimum 12 ft clearance",
      "Over public streets / parking areas: minimum 18 ft clearance",
      "Service conductors must be protected from physical damage",
      "Only one service per building (exceptions apply for fire pumps, multiple occupancies)",
      "Service entrance cable (SE) not permitted in conduit unless specifically listed",
      "Meter socket enclosure must be accessible to utility — cannot be behind locked door",
    ],
  },
  {
    title: "Transformer & Separately Derived Systems — 450 / 250.30",
    items: [
      "Transformer overcurrent protection: primary OCPD ≤ 125% of rated primary current",
      "Secondary OCPD: ≤ 125% of rated secondary current for transformers >9kVA",
      "Dry-type transformers indoors: must be separated from combustibles by 12 inches",
      "Separately derived system requires its own system bonding jumper at source",
      "Separately derived system requires its own grounding electrode conductor",
      "Do NOT bond neutral to ground at secondary of SDS if it is bonded at source",
      "Common SDS examples: isolation transformers, generators, UPS systems",
      "kVA sizing: Load (VA) = Voltage × Amperage  |  kVA = VA / 1000",
      "3-phase kVA: kVA = (V × A × 1.732) / 1000",
    ],
  },
  {
    title: "Motor Calculations — Article 430",
    items: [
      "Branch circuit conductors: minimum 125% of motor full-load current (FLA)",
      "Branch circuit OCPD: up to 250% of FLA for inverse-time breakers (Table 430.52)",
      "Overload protection: set at 115% of FLA (SF < 1.15 or temp rise > 40°C) or 125% (SF ≥ 1.15)",
      "Disconnecting means: must be within sight of motor and within 50 ft",
      "Combination motor controller: may serve as disconnect if rated for the load",
      "Use NEC Table 430.248 for single-phase FLA values",
      "Use NEC Table 430.250 for three-phase FLA values",
      "Largest motor in a group: add 25% of its FLA to the sum of the others (430.24)",
      "Motor control center (MCC): each unit must have its own disconnect means",
    ],
  },
  {
    title: "Conduit Fill — NEC Chapter 9",
    items: [
      "1 conductor: maximum 53% fill",
      "2 conductors: maximum 31% fill",
      "3 or more conductors: maximum 40% fill",
      "Nipples ≤ 24 inches: may be filled to 60%",
      "Use Table 5 for THHN/THWN conductor cross-sectional areas",
      "Use Table 4 for conduit/tubing internal cross-sectional areas",
      "Derate ampacity when more than 3 current-carrying conductors per 310.15(C)",
      "4–6 CCC: derate to 80%  |  7–9: 70%  |  10–20: 50%",
    ],
  },
  {
    title: "Load Calculations — Article 220",
    items: [
      "General lighting load (dwelling unit): 3 VA per sq ft of floor area",
      "Small appliance branch circuits: 1,500 VA per circuit (minimum 2 circuits in kitchen)",
      "Laundry branch circuit: 1,500 VA",
      "Demand factors (220.42): First 3,000 VA @ 100%; 3,001–120,000 VA @ 35%; Over 120,000 VA @ 25%",
      "Electric dryer: 5,000W or nameplate, whichever is larger (220.54)",
      "Electric ranges: use Table 220.55 demand factors for multiple units",
      "Fixed appliances (4+): add 75% of combined nameplate ratings",
      "A/C vs heat: use the larger of the two loads, not both (220.60)",
      "Commercial lighting: use actual VA or 3.5 VA/sq ft for offices (Table 220.12)",
    ],
  },
  {
    title: "Equipment Disconnects — 422 / 424 / 440",
    items: [
      "Appliances: disconnect must be within sight OR be lockable in open position",
      "HVAC equipment: disconnect within sight of equipment and within 50ft",
      "A/C hermetic motor compressors: OCPD up to 175% of rated load current",
      "Heat pumps: disconnecting means must be within sight of unit",
      "Electric heating: each unit must have its own disconnecting means",
      "Within sight means visible and not more than 50ft away",
      "Lockable disconnects acceptable as substitute for within-sight in some cases",
      "Motor-driven appliances over ⅛ HP: required to have a disconnect",
    ],
  },
  {
    title: "Low Voltage & Class 2 Wiring — Article 725",
    items: [
      "Class 1 circuits: up to 600V, follow full NEC wiring methods",
      "Class 2 circuits: ≤100VA/≤30V (inherently limited) or power-limited supply",
      "Class 2 wiring not permitted in same cable/conduit as Class 1 or power wiring",
      "Class 2 cables: CL2, CL2R (riser), CL2P (plenum) — use correct listing for location",
      "Separation from power wiring: maintain 2 inches unless divided by barrier",
      "Class 2 circuits may use smaller conductors — not subject to 310.15 ampacity",
      "Common Class 2 applications: thermostats, access control, AV systems, nurse call",
      "Power over Ethernet (PoE): listed as Class 2 if within power limits",
    ],
  },
  {
    title: "Fire Alarm Wiring — Article 760",
    items: [
      "NPLFA (non-power-limited): wiring methods per Chapter 3, conductors min 18 AWG",
      "PLFA (power-limited): may use listed cables (FPLP, FPLR, FPL)",
      "FPLP (plenum): required in air-handling spaces",
      "FPLR (riser): permitted in vertical runs through floors",
      "FPL (general): permitted in general areas",
      "Separation from power wiring: 2 inches minimum unless in metal raceway",
      "Survivability required for circuits to emergency components (2-hour rating)",
      "Accessible junction boxes required — concealment not permitted without access",
      "All fire alarm wiring must be installed per NFPA 72 in addition to NEC 760",
    ],
  },
  {
    title: "Wiring Methods — Articles 300–399",
    items: [
      "NM-B (Romex): permitted in dry locations in wood-framed residential construction",
      "NM-B not permitted: in commercial buildings, exposed in basements, or embedded in concrete",
      "EMT: permitted in dry, damp, and wet locations — most common commercial raceway",
      "RMC / IMC: suitable for all locations including direct burial and concrete encasement",
      "PVC: permitted for direct burial and concrete encasement — derate in conduit per 310.15",
      "Minimum burial depth (direct burial cable): 24 inches (less with conduit)",
      "Stapling NM-B: support within 12 inches of boxes and every 4.5 ft",
      "Bending radius: minimum 5× the trade diameter of the conduit (NEC 358.24 for EMT)",
      "MC cable: support within 12 inches of boxes and every 6 ft",
      "AC cable (BX): support within 12 inches of boxes and every 4.5 ft",
    ],
  },
  {
    title: "Torque Specifications — 110.14",
    items: [
      "Torque values must be applied per manufacturer instructions and listing",
      "Failure to torque is a common inspection violation — always use a torque screwdriver",
      "Typical residential breaker lugs: 35 in-lb for 15–20A, 40–50 in-lb for larger",
      "Typical panel main lugs: 100–250 in-lb depending on size",
      "Typical receptacles/switches: 12 in-lb for terminal screws",
      "Torque specs printed on device or in manufacturer's instructions",
      "Aluminum conductors require anti-oxidant compound and torque per listing",
      "Re-torquing required after thermal cycling on large conductors",
      "Torque marking required on listed equipment — look for the torque marking symbol",
    ],
  },
];

function NECInner() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;
  const s = makeStyles(C);
  const [open, setOpen]   = useState<number|null>(null);
  const [search, setSearch] = useState("");

  const filtered = necData.filter(sec =>
    search === "" ||
    sec.title.toLowerCase().includes(search.toLowerCase()) ||
    sec.items.some(item => item.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

      {/* Search */}
      <View style={[s.card, { marginBottom:8 }]}>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search NEC topics..."
          placeholderTextColor={C.muted}
        />
        {search !== "" && (
          <Text style={[s.infoText, { marginTop:4 }]}>
            {filtered.length} section{filtered.length !== 1 ? "s" : ""} found
          </Text>
        )}
      </View>

      {filtered.map((sec, i) => {
        const originalIndex = necData.indexOf(sec);
        const isOpen = open === originalIndex;
        return (
          <View key={originalIndex} style={{ marginBottom:8 }}>
            <TouchableOpacity
              style={[s.card, { marginBottom:0, borderBottomLeftRadius: isOpen ? 0 : 8, borderBottomRightRadius: isOpen ? 0 : 8 }]}
              onPress={() => setOpen(isOpen ? null : originalIndex)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                <Text style={[s.cardTitle, { marginBottom:0, flex:1, paddingRight:8 }]}>{sec.title}</Text>
                <Text style={{ color:C.accent, fontSize:18, fontWeight:"700" }}>{isOpen ? "−" : "+"}</Text>
              </View>
            </TouchableOpacity>

            {isOpen && (
              <View style={{
                backgroundColor: C.input,
                borderWidth:1, borderTopWidth:0,
                borderColor:C.border,
                borderBottomLeftRadius:8, borderBottomRightRadius:8,
                padding:12,
              }}>
                {sec.items.map((item, j) => (
                  <View key={j} style={{ flexDirection:"row", paddingVertical:5, borderBottomWidth: j < sec.items.length-1 ? 1 : 0, borderBottomColor:C.border }}>
                    <Text style={{ color:C.accent, fontSize:12, marginRight:8, marginTop:1 }}>›</Text>
                    <Text style={[s.necItem, { borderBottomWidth:0, paddingVertical:0, flex:1 }]}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={[s.infoText, { textAlign:"center", marginBottom:20 }]}>
        Based on NEC 2023. Always verify with your local AHJ and applicable amendments.
      </Text>
    </ScrollView>
  );
}

export function NECScreen() {
  return <ProGate feature="NEC Quick Reference"><NECInner/></ProGate>;
}
