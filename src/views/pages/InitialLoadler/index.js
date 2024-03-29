import React, { Component } from 'react';
import { View, SafeAreaView } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import AsyncStorage from '@react-native-community/async-storage';
import Spinner from 'react-native-loading-spinner-overlay';
import styles from './styles';

//redux
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { duckOperations } from '../../../redux/Main/duck';

import {
  checktokenInfo,
  getUserDetails,
  getAllCity,
  getAllTags,
  getNotification,
  getAllGiftsIcon,
} from '../../../services/AuthService';

class InitialLoadler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }
  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.checkLogIn();
      this.getCities();
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  checkLogIn = async () => {
    this.setState({ loading: true });
    try {
      const response = await checktokenInfo();
      if (response.result.is_valid_token) {
        setTimeout(x => {
          SplashScreen.hide();
          this.setState({ loading: false });
        }, 500);
        this.UpdateNessaryInformation();
        this.props.navigation.navigate('TabNavigator');
      } else {
        setTimeout(x => {
          SplashScreen.hide();
          this.setState({ loading: false });
        }, 500);
        this.logOutUser();
      }
    } catch {
      setTimeout(x => {
        SplashScreen.hide();
        this.setState({ loading: false });
      }, 500);
      this.logOutUser();
    }
  };

  logOutUser = async () => {
    await AsyncStorage.clear();
    this.props.navigation.navigate('Registration');
  };

  UpdateNessaryInformation = id => {
    this.getAllTags();
    this.getAllNotification();
    this.getUserInfo();
    this.getAllGiftIcons();
  };

  getAllGiftIcons = async () => {
    try {
      const response = await getAllGiftsIcon();
      if (response.isSuccess) {
        this.props.getAllGiftIcon(response.result.gift_icon);
      }
    } catch { }
  };

  getAllTags = async () => {
    try {
      const response = await getAllTags();
      this.props.addTagValue(response.result.tag_values[0]);
    } catch { }
  };

  getCities = async () => {
    try {
      const response = await getAllCity();
      if (response.isSuccess) {
        this.props.updateCityList(response.result.city_list);
      }
    } catch { }
  };
  getAllNotification = async () => {
    const response = await getNotification();
    if (response.isSuccess) {
      this.props.allNotifications(response.result.notification_list);
    }
  };
  getUserInfo = async () => {
    try {
      const response = await getUserDetails();
      if (response.isSuccess) {
        this.props.addUserInfo(response.result.success);
      }
    } catch { }
  };

  render() {
    return (
      <SafeAreaView>
        <View>
          <Spinner
            visible={this.state.loading}
            textContent={'読み込み中...'}
            textStyle={styles.spinnerTextStyle}
          />
        </View>
      </SafeAreaView>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    castTypeInformations: state.mainReducers.main.castTypeInformations,
    allCity: state.mainReducers.main.allCity,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(duckOperations, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(InitialLoadler);
