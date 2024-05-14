/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import {Text, TouchableOpacity} from 'react-native';

import * as imagePicker from 'react-native-image-picker';

import SendbirdChat from '@sendbird/chat';
import SendBirdDesk, {Ticket} from 'sendbird-desk';
import {GroupChannelModule} from '@sendbird/chat/groupChannel';
import {useEffect} from 'react';

async function connectDesk() {
  const params = {
    appId: '1322FB2D-0003-4318-8225-301A6DA0C69F',
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);
  try {
    await sb.connect('test');
    SendBirdDesk.init(sb as any);
    SendBirdDesk.authenticate(
      'test',
      // authentication callback
      () => {
        console.log('desk connected');
      },
    );
  } catch (error) {
    console.log('desk connect failure', error);
  }
}

const App = () => {
  useEffect(() => {
    connectDesk();
  }, []);

  return (
    <TouchableOpacity
      onPress={async () => {
        const {assets} = await imagePicker.launchImageLibrary({
          presentationStyle: 'fullScreen',
          selectionLimit: 1,
          mediaType: 'photo',
        });

        const asset = (assets ?? [])[0];
        if (asset) {
          Ticket.create('TICKET_TITLE', 'USER_NAME', (ticket, error) => {
            if (error) {
              console.log('ticket creation failure', error);
              // Handle error.
            } else if (ticket) {
              console.log('ticket created', ticket.id);

              SendBirdDesk.setCustomerCustomFields(
                {
                  custom: 'field',
                },
                (res, err) => {
                  if (res) {
                    console.log('custom fields set');
                    ticket.channel
                      .sendUserMessage({
                        message: 'initial message',
                      })
                      .onSucceeded(() => {
                        console.log('initial message sent');
                        if (asset.uri && asset.type) {
                          ticket.channel
                            .sendFileMessages([
                              {
                                file: {
                                  uri: asset.uri,
                                  name: asset.fileName || 'filename',
                                  type: asset.type,
                                },
                              },
                            ])
                            .onSucceeded(m => {
                              console.log('file message succeeded', m);
                            })
                            .onFailed(error => {
                              console.log('file message failed', error);
                            })
                            .onPending(() => {
                              console.log('file message pending...');
                            });
                        }
                      });
                  } else {
                    console.log('custom fields set failure', err);
                  }
                },
              );
            }
          });
        }
      }}
      style={{
        width: 200,
        height: 50,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>{'Press please '}</Text>
    </TouchableOpacity>
  );
};

export default App;
