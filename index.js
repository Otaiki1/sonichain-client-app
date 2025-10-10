import './polyfill';
import { Crypto } from '@peculiar/webcrypto';

Object.assign(global.crypto, new Crypto());

import 'expo-router/entry';
