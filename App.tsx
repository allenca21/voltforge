import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StoreProvider, useStore } from "./src/store";
import { DARK, LIGHT } from "./src/theme";
import { HomeScreen }        from "./src/screens/HomeScreen";
import { OhmScreen }         from "./src/screens/OhmScreen";
import { WireScreen }        from "./src/screens/WireScreen";
import { FractionScreen }    from "./src/screens/FractionScreen";
import { ConduitFillScreen } from "./src/screens/ConduitFillScreen";
import { BenderScreen }      from "./src/screens/BenderScreen";
import { PullTensionScreen } from "./src/screens/PullTensionScreen";
import { TransformerScreen } from "./src/screens/TransformerScreen";
import { NECScreen }         from "./src/screens/NECScreen";
import { JobScreen }         from "./src/screens/JobScreen";
import { LoadCalcScreen }    from "./src/screens/LoadCalcScreen";
import { UpgradeScreen }     from "./src/screens/UpgradeScreen";

const Stack = createNativeStackNavigator();

const SCREENS = [
  { name:"OhmScreen",      title:"Ohm's Law & Voltage Drop",  comp:OhmScreen         },
  { name:"WireScreen",     title:"Wire Ampacity Table",        comp:WireScreen         },
  { name:"FractionScreen", title:"Fraction Calculator",        comp:FractionScreen     },
  { name:"ConduitScreen",  title:"Conduit Fill Calculator",    comp:ConduitFillScreen  },
  { name:"BenderScreen",   title:"Conduit Bender",             comp:BenderScreen       },
  { name:"PullScreen",     title:"Wire Pull Tension",          comp:PullTensionScreen  },
  { name:"XfmrScreen",     title:"Transformer Wiring",         comp:TransformerScreen  },
  { name:"NECScreen",      title:"NEC Quick Reference",        comp:NECScreen          },
  { name:"EstimateScreen", title:"Job Estimator",              comp:JobScreen          },
  { name:"LoadCalcScreen", title:"Load Calculator",            comp:LoadCalcScreen     },
  { name:"UpgradeScreen",  title:"Upgrade to Pro",             comp:UpgradeScreen      },
];

function AppNavigator() {
  const { isDark } = useStore();
  const C = isDark ? DARK : LIGHT;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor:C.header },
          headerTintColor: C.accent,
          headerTitleStyle: { fontWeight:"700", fontSize:16, color:C.accent },
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor:C.bg },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown:false }}
        />
        {SCREENS.map(sc => (
          <Stack.Screen
            key={sc.name}
            name={sc.name}
            component={sc.comp}
            options={{ title: sc.title }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AppNavigator/>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
