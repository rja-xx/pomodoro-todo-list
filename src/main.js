import Vue from 'vue'
import App from './App.vue'
import Vuex from "vuex";

Vue.config.productionTip = false;

Vue.use(Vuex);

const store = new Vuex.Store({
    state:{
      cognito: {
        auth: null,
        session: null
      }
    },
    mutations:{

          setCognitoSession(state, cognitoSession) {
            state.cognito.session = cognitoSession;
          },
          setCognitoAuth(state, cognitoAuth) {
            state.cognito.auth = cognitoAuth;
          },
    }

});



setInterval(() => {
  var session = store.state.cognito.session;

  if (session && session.idToken && session.refreshToken) {
    var expires = session.idToken.payload.exp;
    var now = new Date().getTime() / 1000;

    // Refresh session if ID token expires in less than 30 minutes.
    if (expires - now < 30 * 60) {
      console.log(
        "Cognito token expires in " + (expires - now) + " seconds. Refreshing."
      );
      store.state.cognito.auth.refreshSession(session.refreshToken.getToken());
    }
  }
}, 5 * 60000); // check every 5 minutes

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
