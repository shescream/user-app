import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../component/Button';
import { startPanic, stopPanic } from '../lib/panic';

export default function Index() {
  const [active, setActive] = useState(false);

  function onBtnPress() {
    if (!active) {
      startPanic();
    } else {
      stopPanic();
    }
    setActive(!active);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hit the button below in a panic situation
      </Text>
      <Button onPress={onBtnPress} active={active} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25292e',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
});
