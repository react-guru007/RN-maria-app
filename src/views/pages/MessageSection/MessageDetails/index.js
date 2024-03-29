import React, { Component } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Alert,
  ScrollView,
  TouchableHighlight,
  Button,
} from 'react-native';
import { GiftedChat, Bubble, MessageText, MessageImage } from 'react-native-gifted-chat';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import shortid from 'shortid';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import {
  singleUserUpdatedMessage,
  sendMessage,
  sendGift,
  uploadMessageImage,
  BlockUser,
  reportUser,
} from '../../../../services/AuthService';
import StepByStepProcess from '../../../components/StepByStepProcess';
import styles from './styles';

//redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { duckOperations } from '../../../../redux/Main/duck';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      loadEarlier: true,
      typingText: null,
      isLoadingEarlier: true,
      user_id: null,
      dateData: null,
      user_name: '',
      user_pic: '',
      modalStatus: false,
      isCalenderOpen: true,
      isReportModalPopUp: false,
      isBlockModalPopUp: false,
      isGiftOpen: false,
      DateProfImageUri: '',
      DateProfImagePath: '',
      reportedIssue: '',
      show: false,
    };
    this._isMounted = false;
    this.onSend = this.onSend.bind(this);
    this.onReceive = this.onReceive.bind(this);
    this.renderCustomActions = this.renderCustomActions.bind(this);
    this.renderBubble = this.renderBubble.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.renderLoadEarlier = this.renderLoadEarlier.bind(this);
    this.renderMessageText = this.renderMessageText.bind(this);
    this.renderMessageImage = this.renderMessageImage.bind(this);
    this.onLoadEarlier = this.onLoadEarlier.bind(this);

    this._isAlright = null;
  }
  componentDidMount() {
    this._isMounted = true;
    this.props.updateCurrentMessage([]);
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getUpdatedMessage();
    });
    this.setState({
      user_pic: this.props.route.params.user_pic,
      user_name: this.props.route.params.user_name,
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  getUpdatedMessage = async () => {
    try {
      const response = await singleUserUpdatedMessage(
        this.props.route.params.user_id,
      );
      let data = response.result.message.data;
      this.props.updateCurrentMessage(response.result.message);
      this.setState({
        messages: data,
        user_id: response.result.message.me_id,
        user_pic: this.props.route.params.user_pic,
        user_name: this.porps.route.params.user_name,
      });
      this.forceUpdate();
    } catch { }
  };
  onSend(messages = []) {
    if (
      this.props.userInfo &&
      this.props.userInfo.last_deposite_balance != '0'
    ) {
      this.setState(
        {
          dateData: null,
        },
        () => {
          this.forceUpdate();
          this.sendMessageToOthers(messages);
          this.props.pushCurrentMessage(
            messages[0],
            this.props.route.params.user_id,
            this.props.userInfo.id,
          );
        },
      );
    } else {
      Alert.alert(
        '警告',
        'クレジットカードを登録してください, 今すぐクレジットカードを登録するには、[はい]を押します',
        [
          {
            text: 'キャンセル',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'はい',
            onPress: () => {
              this.props.navigation.navigate('UserDeposite');
            },
          },
        ],
        { cancelable: false },
      );
    }
  }

  sendMessageToOthers = async messages => {
    let data = {
      receiver_id: this.props.route.params.user_id,
      text: messages[0].text,
    };
    try {
      const response = await sendMessage(data);
    } catch { }
  };

  componentWillUnmount() {
    this._isMounted = false;
    this._unsubscribe();
  };

  onLoadEarlier() {
    this.getUpdatedMessage();
  };

  onReceive(text) {
    this.setState(previousState => {
      return {
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: text,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://facebook.github.io/react/img/logo_og.png',
          },
        }),
      };
    });
  };

  onImageReceive(image) {
    this.setState(previousState => {
      return {
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          image: image,
          createdAt: new Date(),
          user: {
            _id: this.props.userInfo.id,
            name: 'React Native',
            avatar: 'https://facebook.github.io/react/img/logo_og.png',
          },
        }),
      };
    });
  }

  renderCustomActions(props) {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={{ padding: 7 }} onPress={() => this.openGift()}>
          <Icon name="gift" size={25} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 7 }} onPress={() => this.sendImage()}>
          <Icon name="image" size={25} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 7 }}
          onPress={() => this.openCalender()}>
          <Icon name="calendar" size={25} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  sendImage = () => {
    if (this.props.userInfo && this.props.userInfo.last_deposite_balance != '0') {
      Alert.alert(
        '画像送信',
        '送信する画像を選んでください。',
        [
          {
            text: '撮影する',
            onPress: () => this.takePhotoFromCamera(),
            style: 'cancel',
          },
          {
            text: '画像ライブラリから',
            onPress: () => this.takePhotoFromLibrary(),
          },
        ],
        { cancelable: true },
      );
    } else {
      Alert.alert(
        '警告',
        'クレジットカードを登録してください, 今すぐクレジットカードを登録するには、[はい]を押します',
        [
          {
            text: 'キャンセル',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'はい',
            onPress: () => {
              this.props.navigation.navigate('UserDeposite');
            },
          },
        ],
        { cancelable: false },
      );
    }
  };

  takePhotoFromCamera = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 1,
      saveToPhotos: false,
      maxWidth: 500,
      maxHeight: 500
    }

    ImagePicker.launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        this.uploadImage(response);
        this.setState({
          DateProfImageUri: response.uri,
          DateProfImagePath: response.path,
        });
      }
    });
  };

  takePhotoFromLibrary = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 1,
      maxWidth: 500,
      maxHeight: 500
    }

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        this.uploadImage(response);
        this.setState({
          DateProfImageUri: response.uri,
          DateProfImagePath: response.path,
        });
      }
    });
  };

  uploadImage = data => {
    this.newUrlImageMessage(data.uri);
    this.uploadMessageImage(data);
  };

  newUrlImageMessage = url => {
    let message = {
      createdAt: new Date(),
      text: '',
      image: url,
      user: { _id: this.props.userInfo.id },
      _id: shortid.generate(),
    };
    this.props.pushCurrentMessage(
      message,
      this.props.route.params.user_id,
      this.props.userInfo.id,
    );
    this.forceUpdate();
    setTimeout(x => {
      this.forceUpdate();
    }, 500);
  };

  uploadMessageImage = async (data) => {
    try {
      await uploadMessageImage({}, data.uri, data.type, data.fileName, this.props.route.params.user_id);
    } catch (errors) {
      console.log("Message's Image Upload error", errors);
    }
  };

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#ddd',
          },
          right: {
            backgroundColor: '#ccd8ff'
          }
        }}
        timeTextStyle={{
          right: {
            color: '#999'
          }
        }}
        textStyle={{
          right: {
            color: '#000'
          }
        }}
      />
    );
  }

  renderFooter(props) {
    if (this.state.typingText) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{this.state.typingText}</Text>
        </View>
      );
    }
    return null;
  }

  renderLoadEarlier(props) {
    return (
      <View
        style={styles.loadEarlierButton}
      >
        <Button
          title="以前のメッセージをロード"
          color="#ccc"
          onPress={this.onLoadEarlier}
        >
        </Button>
      </View>
    )
  }

  renderMessageText(props, userInfo) {
    if (userInfo && userInfo.last_deposite_balance === '0' && props.currentMessage.user._id !== userInfo.id) {
      return (
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 200, height: 60 }}>
          <Button
            title="メッセージを確認する"
            color="#ffb366"
            onPress={() => {
              Alert.alert(
                '警告',
                'メッセージを確認するためには、クレジットカードの登録が必要です。今すぐクレジットカードを登録するには、[はい]を押します。',
                [
                  {
                    text: 'キャンセル',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                  },
                  {
                    text: 'はい',
                    onPress: () => {
                      this.props.navigation.navigate('UserDeposite');
                    },
                  },
                ],
                { cancelable: false },
              )
            }}
          >
          </Button>
        </View>
      );
    } else {
      return (
        <MessageText
          {...props}
        ></MessageText>
      );
    }
  }

  renderMessageImage(props, userInfo) {
    if (userInfo && userInfo.last_deposite_balance === '0' && props.currentMessage.user._id !== userInfo.id) {
      return (
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 200, height: 60 }}>
          <Button
            title="メッセージを確認する"
            color="#ffb366"
            onPress={() => {
              Alert.alert(
                '警告',
                'メッセージを確認するためには、クレジットカードの登録が必要です。今すぐクレジットカードを登録するには、[はい]を押します。',
                [
                  {
                    text: 'キャンセル',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                  },
                  {
                    text: 'はい',
                    onPress: () => {
                      this.props.navigation.navigate('UserDeposite');
                    },
                  },
                ],
                { cancelable: false },
              )
            }}
          >
          </Button>
        </View>
      );
    } else {
      return (
        <MessageImage
          {...props}
        ></MessageImage>
      );
    }
  }

  openModal = () => {
    this.setState({
      modalStatus: !this.state.modalStatus,
    });
  };

  openCalender = () => {
    if (
      this.props.userInfo &&
      this.props.userInfo.last_deposite_balance != '0'
    ) {
      this.setState({
        isCalenderOpen: !this.state.isCalenderOpen,
      });
    } else {
      Alert.alert(
        '警告',
        'クレジットカードを登録してください, 今すぐクレジットカードを登録するには、[はい]を押します',
        [
          {
            text: 'キャンセル',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'はい',
            onPress: () => {
              this.props.navigation.navigate('UserDeposite');
            },
          },
        ],
        { cancelable: false },
      );
    }
  };

  openGift = () => {
    this.setState({
      isGiftOpen: !this.state.isGiftOpen,
    });
  };

  handleDate = val => {
    this.setState(
      {
        dateData: val,
      },
      () => {
        this.setState({
          dateData: null,
        });
        this.openCalender();
      },
    );
  };
  openReport = () => {
    this.setState({ isReportModalPopUp: !this.state.isReportModalPopUp });
    this.setState({
      modalStatus: false,
    });
  };
  openBlock = () => {
    this.setState({ isBlockModalPopUp: !this.state.isBlockModalPopUp });
    this.setState({
      modalStatus: false,
    });
  };
  sendGift = async data => {
    Alert.alert(
      '確認',
      `このギフトをこのユーザーに送信しますか？ ${data.icon_value}Pかかります。`,
      [
        {
          text: 'キャンセル',
          onPress: () => this.setState({ isGiftOpen: false }),
        },
        {
          text: 'はい',
          onPress: () => this.confirmGift(data),
        },
      ],
      { cancelable: false },
    );
  };
  confirmGift = async data => {
    let purchaseValue = Number(data.icon_value);
    let UserHaveValue = this.props.userInfo.points;
    if (purchaseValue > UserHaveValue) {
      Alert.alert(
        '警告',
        'アカウントに十分なポイントがありません。 ポイントを貯めてください。',
        [
          {
            text: '預金残高',
            onPress: () => {
              this.setState({ isGiftOpen: false });
              this.props.navigation.navigate('UserDeposite');
            },
          },
          {
            text: 'キャンセル',
            onPress: () => this.setState({ isGiftOpen: false }),
          },
        ],
        { cancelable: false },
      );
    } else {
      let value = {
        gift_id: data.id,
        guest_id: this.props.route.params.user_id,
      };
      try {
        const response = await sendGift(value);
        if (response.isSuccess) {
          this.setState({ isGiftOpen: false });
          this.newImageMessage(data);
          // this.updateMessage(this.props.route.params.user_id);
        }
      } catch { }
    }
  };
  newImageMessage = url => {
    let message = {
      createdAt: new Date(),
      text: `you have give ${url.icon_value}P as gift`,
      image: url.icon_url,
      user: { _id: this.props.userInfo.id },
      _id: shortid.generate(),
    };
    this.props.pushCurrentMessage(
      message,
      this.props.route.params.user_id,
      this.props.userInfo.id,
    );
    setTimeout(x => {
      this.forceUpdate();
    }, 500);
  };

  blockUser = async () => {
    this.setState({ isBlockModalPopUp: false });
    let data = {
      blocked_user: this.props.route.params.user_id,
    };
    try {
      const response = await BlockUser(data);
      this.props.navigation.goBack();
    } catch { }
  };

  reportUser = async () => {
    if (!this.state.reportedIssue) {
      Alert.alert(
        'ウォーニング',
        '問題を通報してください。空欄にすることはできません。',
        [
          {
            text: 'オーケー',
            onPress: () => console.log('okay'),
          },
        ],
        { cancelable: false },
      );
      return;
    }
    let data = {
      reported_id: this.props.route.params.user_id,
      issues: this.state.reportedIssue,
    };
    try {
      const response = await reportUser(data);
      this.setState({ isReportModalPopUp: false });
      Alert.alert(
        '成功',
        '通報書が管理者に転送されました。処理結果について後でお知らせします。',
        [
          {
            text: 'オーケー',
            onPress: () => console.log('closed'),
          },
        ],
        { cancelable: false },
      );
    } catch { }
  };

  closeNotification = v => {
    this.setState({ [v]: false });
  };

  onChangeDate = (event, selectedDate) => {
    console.log(event, selectedDate);
  };

  render() {
    const { user_pic, user_name, dateData } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <View style={styles.titleStyleContainer}>
              <TouchableOpacity
                onPress={() => this.props.navigation.goBack()}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingRight: 30,
                }}>
                <Icon
                  name="angle-left"
                  style={{ padding: 0, margin: 0 }}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>

              <Text style={styles.titleStyleWithBack}>{user_name}</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 80,
                }}
                onPress={this.openModal}>
                <Image
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 40,
                    marginRight: 10,
                  }}
                  source={
                    user_pic !== ''
                      ? { uri: user_pic }
                      : require('../../../../assets/panda.png')
                  }
                />
                <Icon name="ellipsis-v" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
        {dateData ?
          <GiftedChat
            messages={this.props.currentChat ? this.props.currentChat.data : []}
            onSend={this.onSend}
            text={dateData}
            loadEarlier={this.state.loadEarlier}
            onLoadEarlier={this.onLoadEarlier}
            isLoadingEarlier={this.state.isLoadingEarlier}
            user={{
              _id: this.props.userInfo.id,
            }}
            renderActions={this.renderCustomActions}
            renderBubble={this.renderBubble}
            placeholder="ここにメッセージを入力..."
            renderMessageText={(props) => this.renderMessageText(props, this.props.userInfo)}
            renderMessageImage={(props) => this.renderMessageImage(props, this.props.userInfo)}
          // renderFooter={this.renderFooter}
          />
          :
          <GiftedChat
            messages={this.props.currentChat ? this.props.currentChat.data : []}
            onSend={this.onSend}
            loadEarlier={this.state.loadEarlier}
            onLoadEarlier={this.onLoadEarlier}
            isLoadingEarlier={this.state.isLoadingEarlier}
            user={{
              _id: this.props.userInfo.id,
            }}
            renderActions={this.renderCustomActions}
            renderBubble={this.renderBubble}
            placeholder="ここにメッセージを入力..."
            renderLoadEarlier={this.renderLoadEarlier}
            renderMessageText={(props) => this.renderMessageText(props, this.props.userInfo)}
            renderMessageImage={(props) => this.renderMessageImage(props, this.props.userInfo)}
          // renderFooter={this.renderFooter}
          />
        }

        <Modal
          onBackdropPress={this.openModal}
          isVisible={this.state.modalStatus}
          swipeDirection={['up', 'left', 'right', 'down']}
          style={styles.ModalView2}
        >
          <View style={styles.content}>
            <Text
              onPress={this.openReport}
              style={{
                borderTopColor: '#aaa',
                fontWeight: 'bold',
                borderBottomWidth: 0.5,
                padding: 10,
              }}>
              通報する
            </Text>
            <Text
              onPress={this.openBlock}
              style={{ padding: 10, fontWeight: 'bold' }}>
              ブロックする
            </Text>
            <Text
              style={{
                borderTopColor: '#aaa',
                fontWeight: 'bold',
                borderTopWidth: 0.5,
                padding: 10,
              }}
              onPress={this.openModal}>
              キャンセル
            </Text>
          </View>
        </Modal>

        <Modal
          onBackdropPress={this.openGift}
          isVisible={this.state.isGiftOpen}
          swipeDirection={['up', 'left', 'right', 'down']}
          style={styles.ModalView2}
        >
          <View style={styles.content}>
            <Text style={styles.giftModalTitle}>
              このキャストにギフトを送る。
            </Text>
            <View style={styles.giftContainer}>
              {this.props.giftIcons &&
                this.props.giftIcons.map(x => (
                  <TouchableOpacity
                    key={shortid.generate()}
                    style={styles.giftButton}
                    onPress={() => this.sendGift(x)}
                  >
                    <Image
                      style={styles.giftItem}
                      source={{ uri: x.icon_url }}
                    />
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </Modal>

        <Modal
          onBackdropPress={this.openCalender}
          isVisible={this.state.isCalenderOpen}
          swipeDirection={['up', 'left', 'right', 'down']}
          style={styles.ModalView2}>
          <TouchableWithoutFeedback
            onPress={() => this.closeNotification('isCalenderOpen')}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.content}>
            <View style={styles.mainRow}>
              <Text style={styles.rowTitle}>予約を取る</Text>
            </View>
            <ScrollView>
              <TouchableHighlight>
                <View>
                  <View style={styles.containerModal}>
                    <View style={styles.containerModalItem}>
                      <Text style={styles.titleModal}>日付を選択</Text>
                    </View>
                    <View style={styles.containerModalItem}>
                      <Text>時間の選択</Text>
                    </View>
                  </View>
                  <View style={styles.containerModal}>
                    <View style={styles.containerModalItem}>
                      <TouchableOpacity style={styles.dateChoose}>
                        <Text>Choose Date</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.containerModalItem}>
                      <TouchableOpacity style={styles.dateChoose}>
                        <Text>Choose Time</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableHighlight>
            </ScrollView>
            <View style={{ flex: 1, marginTop: 60 }}>
              <StepByStepProcess
                hideIcon={true}
                title="Ok"
                action={() => this.closeNotification('callSettingModalGuest')}
              />
            </View>
          </View>
          {/* <Calendar
            onDayPress={day => {
              this.handleDate(day.dateString);
            }}
            markedDates={{
              '2017-12-14': {
                periods: [
                  {
                    startingDay: false,
                    endingDay: true,
                    color: '#5f9ea0',
                  },
                  {
                    startingDay: false,
                    endingDay: true,
                    color: '#ffa500',
                  },
                  {
                    startingDay: true,
                    endingDay: false,
                    color: '#f0e68c',
                  },
                ],
              },
              '2017-12-15': {
                periods: [
                  {
                    startingDay: true,
                    endingDay: false,
                    color: '#ffa500',
                  },
                  {color: 'transparent'},
                  {
                    startingDay: false,
                    endingDay: false,
                    color: '#f0e68c',
                  },
                ],
              },
            }}
            // Date marking style [simple/period/multi-dot/custom]. Default = 'simple'
            markingType="multi-period"
          /> */}
        </Modal>

        {/* Report Modal */}
        <Modal
          onBackdropPress={this.openReport}
          isVisible={this.state.isReportModalPopUp}>
          <View style={styles.hourlyRate}>
            <Text style={styles.reportText}>通報</Text>
            <Text style={styles.reasonText}>通報の理由</Text>
            <TextInput
              style={styles.comments}
              placeholder="通報の理由を入力してください..."
              onChangeText={text => this.setState({ reportedIssue: text })}
              value={this.state.reportedIssue}
            />
            <View style={styles.optionHolderReport}>
              <TouchableWithoutFeedback onPress={this.openReport}>
                <View style={styles.optionHolderReportoptions}>
                  <Text style={styles.blockCancel}>キャンセル</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={this.reportUser}>
                <View
                  style={[
                    styles.optionHolderReportoptions,
                    styles.blockButton,
                  ]}>
                  <Text style={styles.blockButtonText}>通報する</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View>
              <Text style={{ color: '#777', fontSize: 11 }}>
                *通報する場合は、相手にメッセージを送ることができます。
              </Text>
            </View>
          </View>
        </Modal>

        {/* Block Modal */}
        <Modal
          onBackdropPress={this.openBlock}
          isVisible={this.state.isBlockModalPopUp}
        >
          <View style={styles.blockModal}>
            <Text style={styles.blockUserTextContainer}>
              このユーザーを本当にブロックしますか？
            </Text>
            <Text style={styles.blockUserText}>
              ブロック後のメッセージ交換はできません。管理者と連携することで通信を回復できます。
            </Text>
            <View style={styles.optionHolder}>
              <TouchableWithoutFeedback onPress={this.openBlock}>
                <View style={{ ...styles.options2, marginLeft: 15 }}>
                  <Text style={styles.blockCancel}>キャンセル</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={this.blockUser}>
                <View style={[styles.options2, styles.blockButton]}>
                  <Text style={styles.blockButtonText}>ブロックする</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </Modal>
        {this.state.show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={new Date()}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={this.onChangeDate}
          />
        )}
      </View>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    userInfo: state.mainReducers.main.userInfo,
    currentChat: state.mainReducers.main.currentChat,
    giftIcons: state.mainReducers.main.giftIcons,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(duckOperations, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Search);
