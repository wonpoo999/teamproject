// [ADDED] Prevent bottom UI from being covered by keyboard & Android soft keys
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export default function useKeyboardPadding(extra = 0) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = e => setH(e?.endCoordinates?.height || 0);
    const onHide = () => setH(0);
    const s = Keyboard.addListener(showEvt, onShow);
    const hdl = Keyboard.addListener(hideEvt, onHide);
    return () => { s.remove(); hdl.remove(); };
  }, []);
  return h + (Platform.OS === 'android' ? 28 : 0) + extra;
}
