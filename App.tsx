import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import * as imagePicker from 'react-native-image-picker';

import SendbirdChat from '@sendbird/chat';
import SendBirdDesk, {Ticket} from 'sendbird-desk';
import {GroupChannel, GroupChannelModule} from '@sendbird/chat/groupChannel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createGroupChannelFragment,
  SendbirdUIKitContainer,
  useConnection,
} from '@sendbird/uikit-react-native';

const userid = 'test';
const appid = '1322FB2D-0003-4318-8225-301A6DA0C69F';
async function connectDesk() {
  return new Promise<void>(async (resolve, reject) => {
    const sb = SendbirdChat.init({
      appId: appid,
      modules: [new GroupChannelModule()],
      localCacheEnabled: true,
      useAsyncStorageStore: AsyncStorage,
    });
    try {
      await sb.connect(userid);
      SendBirdDesk.init(sb as any);
      SendBirdDesk.authenticate(
        userid,
        // authentication callback
        () => {
          console.log('desk connected');
          resolve();
        },
      );
    } catch (error) {
      console.log('desk connect failure', error);
      reject(error);
    }
  });
}

const App = () => {
  const [channel, setChannel] = useState<GroupChannel>();

  return (
    <SendbirdUIKitContainer
      appId={appid}
      userProfile={{onCreateChannel() {}}}
      platformServices={
        {
          media: {},
          file: {},
          player: {
            reset() {},
          },
          recorder: {
            reset() {},
            options: {
              minDuration: 0,
            },
          },
          notification: {},
        } as any
      }
      chatOptions={{
        localCacheStorage: AsyncStorage,
        enableAutoPushTokenRegistration: false,
      }}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'gray',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={{flexDirection: 'row', gap: 8}}>
          <Buttons onSetChannel={setChannel} />
        </View>
        {channel && (
          <GroupChannelFragment
            channel={channel}
            onChannelDeleted={() => {}}
            onPressHeaderLeft={() => setChannel(undefined)}
            onPressHeaderRight={() => {}}
          />
        )}
      </View>
    </SendbirdUIKitContainer>
  );
};
const Buttons = ({onSetChannel}: any) => {
  const {connect: connectUIKit} = useConnection();
  return (
    <>
      <TouchableOpacity
        style={{
          flex: 1,
          height: 50,
          backgroundColor: 'white',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={async () => {
          await connectDesk();
          await connectUIKit(userid);
        }}>
        <Text>{'Connect'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          height: 50,
          backgroundColor: 'white',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
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
                                onSetChannel(ticket.channel);
                              })
                              .onFailed(error => {
                                console.log('file message failed', error);
                                onSetChannel(ticket.channel);
                              })
                              .onPending(() => {
                                console.log('file message pending...');
                                onSetChannel(ticket.channel);
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
        }}>
        <Text>{'Create ticket and open channel'}</Text>
      </TouchableOpacity>
    </>
  );
};
const GroupChannelFragment = createGroupChannelFragment();

export default App;
