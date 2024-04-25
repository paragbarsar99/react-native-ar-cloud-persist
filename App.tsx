import React, {useState, useRef, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  StyleSheet,
  View,
  Platform,
  TouchableHighlight,
  Text,
  DrawerLayoutAndroid,
  Button,
  DeviceEventEmitter,
  Pressable,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import {ArViewerView} from 'react-native-ar-viewer';
import RNFS from 'react-native-fs';

const {width, height} = Dimensions.get('screen');
export default function App() {
  const [localModelPath, setLocalModelPath] = useState<string>();
  const [showArView, setShowArView] = useState(false);
  const ref = useRef() as React.MutableRefObject<ArViewerView>;
  const drawer = useRef();
  const [hostedAnchor, setHostedAnchor] = useState<string[]>([]);
  const [onHost, setOnHost] = useState(false);
  const [reslovedAnchor, setResolveAnchor] = useState<string[]>([]);
  const [coinCollected, SetCoinCollected] = useState(0);
  const [hostingEvents, setHostingEvents] = useState<string>();
  const loadPath = async () => {
    const modelSrc =
      Platform.OS === 'android'
        ? 'https://github.com/paragbarsar99/GitLearn/blob/main/pizza.glb?raw=true'
        : 'https://github.com/riderodd/react-native-ar/blob/main/example/src/dice.usdz?raw=true';
    const modelPath = `${RNFS.DocumentDirectoryPath}/model.${
      Platform.OS === 'android' ? 'glb' : 'usdz'
    }`;
    const exists = await RNFS.exists(modelPath);
    if (!exists) {
      await RNFS.downloadFile({
        fromUrl: modelSrc,
        toFile: modelPath,
      }).promise;
    }

    setLocalModelPath(modelPath);
  };

  useEffect(() => {
    loadPath();
  }, []);
  useEffect(() => {
    DeviceEventEmitter.addListener('HostedAnchorId', id => {
      console.log('HostedAnchorId', id.HostedAnchorId);
      if (id.HostedAnchorId) {
        setHostedAnchor(prev => {
          const oldAnchor = [...prev, id.HostedAnchorId];
          AsyncStorage.setItem('HOSTED', JSON.stringify(oldAnchor));

          return oldAnchor;
        });
        Alert.alert(
          'AnchorHosted',
          `AnchorId ${id.HostedAnchorId} hosted on cloud`,
          [
            {
              text: 'Save and exit',
              onPress: () => {
                setShowArView(false);
              },
            },
          ],
        );
      }
    });
    return () => {
      DeviceEventEmitter.removeAllListeners('HostedAnchorId');
    };
  }, []);

  useEffect(() => {
    DeviceEventEmitter.addListener('onSendCurrentAnchorResolving', id => {
      if (id.onSendCurrentAnchorResolving) {
        const oldAnchor = [...reslovedAnchor, id.onSendCurrentAnchorResolving];
        setResolveAnchor(oldAnchor);
      }
    });
    return () => {
      DeviceEventEmitter.removeAllListeners('onSendCurrentAnchorResolving');
    };
  }, []);
  useEffect(() => {
    DeviceEventEmitter.addListener('onRemoveModelSendEventToJS', id => {
      console.log('onRemoveModelSendEventToJS ');
      // if (id.onRemoveModelSendEventToJS) {
      SetCoinCollected(prev => prev + 1);
      // }
    });
    return () => {
      DeviceEventEmitter.removeAllListeners('onRemoveModelSendEventToJS');
    };
  }, []);
  useEffect(() => {
    DeviceEventEmitter.addListener('HostingEvent', id => {
      if (id.HostingEvent) {
        setHostingEvents(id.HostingEvent);
      }
    });
    return () => {
      DeviceEventEmitter.removeAllListeners('HostingEvent');
    };
  }, []);

  useEffect(() => {
    loadPath();
  }, []);

  const host = () => {
    mountUnMount();
    setOnHost(true);
    SetCoinCollected(0);
  };

  const reslove = () => {
    mountUnMount();
    setOnHost(false);
    SetCoinCollected(0);
  };

  const reset = () => {
    setShowArView(false);
    setHostingEvents('');
  };

  const rotate = () => {
    ref.current?.rotate(0, 25, 0);
  };

  useEffect(() => {
    (async () => {
      const anchor = await AsyncStorage.getItem('HOSTED');
      if (anchor) {
        setHostedAnchor(JSON.parse(anchor));
      }
    })();
  }, []);

  const mountUnMount = () => {
    setShowArView(!showArView);
  };
  const clear = async () => {
    setHostedAnchor([]);
    await AsyncStorage.removeItem('HOSTED');
  };
  const navigationView = React.useCallback(
    () => (
      <View style={[styles.container, styles.navigationContainer]}>
        <Button
          title="Close drawer"
          onPress={() => {
            if (drawer.current) {
              drawer.current?.closeDrawer();
            }
          }}
        />
        <Text style={styles.paragraph}>Welcome </Text>
        <Text style={styles.paragraph}>
          Number of pizza collected {coinCollected}
        </Text>
      </View>
    ),
    [coinCollected],
  );
  return (
    <View style={styles.container}>
      <DrawerLayoutAndroid
        ref={drawer}
        renderNavigationView={navigationView}
        drawerWidth={width}>
        {!showArView && (
          <Button
            title="open drawer"
            onPress={() => {
              if (drawer.current) {
                drawer.current?.openDrawer();
              }
            }}
          />
        )}
        {showArView && (
          <View style={{backgroundColor: 'black', padding: 7}}>
            {onHost ? (
              <>
                <Text style={[styles.text, {color: 'white'}]}>
                  Move Around to modal until you see the AnchorMapQuality:
                  SUFFCIENT or COMPLETED
                </Text>
                <Text style={[styles.text, {color: 'white'}]}>
                  AnchorMapQuality :{hostingEvents}
                </Text>
              </>
            ) : (
              <>
                {hostedAnchor.length > 0 && (
                  <>
                    <Text style={[styles.text, {color: 'white'}]}>
                      Point you camera where you are expecting the Ar
                      experiencce
                    </Text>
                    <Text style={[styles.text, {color: 'white'}]}>
                      Total Number of anchor :{hostedAnchor.length}
                    </Text>
                    <Text style={[styles.text, {color: 'white'}]}>
                      Total Number of reslove Anchor :{reslovedAnchor.length}
                    </Text>
                    <Text style={[styles.text, {color: 'white'}]}>
                      coin Collected :{coinCollected}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        )}
        {localModelPath && showArView ? (
          !onHost ? (
            hostedAnchor.length > 0 ? (
              <ArViewerView
                resolvedAnchorId={hostedAnchor}
                planeOrientation="horizontal"
                model={localModelPath}
                style={styles.arView}
                disableInstantPlacement={false}
                manageDepth
                allowRotate={false}
                allowScale={false}
                allowTranslate={false}
                onStarted={() => console.log('started')}
                onEnded={() => console.log('ended')}
                onModelPlaced={() => console.log('model displayed')}
                onModelRemoved={() => {
                  console.log(' modalRemove');
                  SetCoinCollected(coinCollected + 1);
                }}
                ref={ref}
              />
            ) : (
              <Text style={styles.text}>No Hosted Anchor Found</Text>
            )
          ) : (
            <>
              <ArViewerView
                planeOrientation="horizontal"
                model={localModelPath}
                style={styles.arView}
                disableInstantPlacement
                manageDepth
                allowRotate={false}
                allowScale={false}
                allowTranslate={false}
                onStarted={() => console.log('started')}
                onEnded={() => console.log('ended')}
                onModelPlaced={() => console.log('model displayed')}
                onModelRemoved={() => {}}
                ref={ref}
              />
            </>
          )
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
              paddingHorizontal: 20,
              marginTop: 10,
              gap: 10,
            }}>
            <Text style={styles.h1}>Jublient Ar</Text>
            {hostedAnchor.length > 0 && (
              <>
                <Text style={styles.h1}>Anchors Ready to Relsove</Text>

                <ScrollView>
                  {hostedAnchor.map((item, index) => (
                    <Text key={index} style={styles.text}>
                      {index} <Text style={styles.text}>{item}</Text>
                    </Text>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        <View style={styles.footer}>
          {showArView ? (
            <>
              <TouchableHighlight onPress={reset} style={styles.button}>
                <Text style={styles.text}>Stop</Text>
              </TouchableHighlight>
            </>
          ) : (
            <>
              <TouchableHighlight onPress={host} style={styles.button}>
                <Text style={styles.text}>Host</Text>
              </TouchableHighlight>
              <TouchableHighlight onPress={clear} style={styles.button}>
                <Text style={styles.text}>clear</Text>
              </TouchableHighlight>
              <TouchableHighlight onPress={reslove} style={styles.button}>
                <Text style={styles.text}>Reslove</Text>
              </TouchableHighlight>
            </>
          )}
        </View>
      </DrawerLayoutAndroid>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  arView: {
    flex: 2,
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 10,
    width: '100%',
    marginHorizontal: '20%',
    alignSelf: 'center',
    gap: 10,
    padding: 20,
    borderRadius: 20,
  },
  button: {
    borderColor: 'black',
    borderWidth: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  text: {
    color: 'black',
  },
  navigationContainer: {
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    padding: 16,
    fontSize: 15,
    textAlign: 'center',
    color: 'black',
  },
  h1: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});
