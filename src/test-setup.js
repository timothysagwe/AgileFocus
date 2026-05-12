import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom';

globalThis.DOMParser = DOMParser;
globalThis.XMLSerializer = XMLSerializer;
globalThis.DOMImplementation = DOMImplementation;
