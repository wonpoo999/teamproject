import AsyncStorage from "@react-native-async-storage/async-storage"

function todayKey() {
  return new Date().toISOString().split("T")[0]
}

export async function initCalorieData() {
  const today = todayKey()
  const storedDate = await AsyncStorage.getItem("calorie_date")

  if (storedDate !== today) {
    await AsyncStorage.setItem("calorie_date", today)
    await AsyncStorage.setItem("calorie_current", "0")
  }

  const storedCurrent = await AsyncStorage.getItem("calorie_current")
  const storedTarget = await AsyncStorage.getItem("calorie_target")

  const current = storedCurrent ? Number(storedCurrent) : 0
  const target = storedTarget ? Number(storedTarget) : 1200

  return { current, target }
}

export async function addCalories(value) {
  const today = todayKey()
  const storedDate = await AsyncStorage.getItem("calorie_date")

  if (storedDate !== today) {
    await AsyncStorage.setItem("calorie_date", today)
    await AsyncStorage.setItem("calorie_current", "0")
  }

  const stored = await AsyncStorage.getItem("calorie_current")
  const current = stored ? Number(stored) : 0
  const updated = current + Number(value)

  await AsyncStorage.setItem("calorie_current", String(updated))
  return updated
}

export async function setTargetCalories(value) {
  await AsyncStorage.setItem("calorie_target", String(value))
}
