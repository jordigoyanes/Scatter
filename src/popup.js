import Vue from 'vue'
import VueRouter from 'vue-router'
import {ScatterData, LocalStream, NetworkMessage} from 'scattermodels'
import AuthComponent from './components/AuthComponent.vue'
import KeychainComponent from './components/KeychainComponent.vue'
import SettingsComponent from './components/SettingsComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import WorkingAlert from './components/alerts/WorkingAlert.vue'
import ErrorAlert from './components/alerts/ErrorAlert.vue'
import InputComponent from './components/InputComponent.vue'
import SelectComponent from './components/SelectComponent.vue'
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import {ui} from './ui';

Vue.config.productionTip = false;
Vue.use(VueRouter);

let router = null;

const routes = [
    { path: '', name:'auth', component: AuthComponent},
    { path: '/keychain', name:'keychain', component: KeychainComponent},
    { path: '/settings', name:'settings', component: SettingsComponent}
];

LocalStream.send(NetworkMessage.signal(InternalMessageTypes.LOAD)).then(scatter => {
    //TODO: For the love of god, take me out of Vue's window scope [ I am insecure ] [ and not like.. teenage angst insecure, like Deebo has the keys to your house insecure ]
    Vue.prototype.scatterData = ScatterData.fromJson(scatter);
    LocalStream.send(NetworkMessage.signal(InternalMessageTypes.IS_LOCKED)).then(isLocked => {
        Vue.prototype.scatterData.data.keychain.locked = isLocked;
        setupApp();
    })

});

function setupApp(){
    setupRouting();
    setupGlobals();
    registerReusableComponents();
    new Vue({router}).$mount('#scatter');
}

function registerReusableComponents(){
    Vue.component('scatter-button', ButtonComponent);
    Vue.component('scatter-input', InputComponent);
    Vue.component('scatter-select', SelectComponent);
    Vue.component('working-alert', WorkingAlert);
    Vue.component('error-alert', ErrorAlert);
}

function setupRouting(){
    router = new VueRouter({routes});
    router.beforeEach((to, from, next) => {
        switch(to.name){
            case 'auth': beforeAuth(next); break;
            case 'keychain': beforeKeychain(next); break;
            case 'settings': beforeSettings(next); break;
            default:next()
        }
    });
}

function setupGlobals(){
    window.ui = ui;
    Vue.prototype.toggleSettings = () => router.push({name:(router.currentRoute.name === 'settings' ? 'auth' :'settings')});
    Vue.prototype.hideSettingsButton = false;
}

function beforeAuth(next){ if(!Vue.prototype.scatterData.data.keychain.locked) next({name:'keychain'}); else next() }
function beforeKeychain(next){ if(Vue.prototype.scatterData.data.keychain.locked) next({name:'auth'}); else next() }
function beforeSettings(next){ next() }