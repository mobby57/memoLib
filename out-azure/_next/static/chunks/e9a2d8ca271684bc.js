(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,833884,e=>{"use strict";var t=e.i(843476),r=e.i(271645);let a=(0,r.memo)(({size:e="md",color:r="blue",className:a=""})=>(0,t.jsxs)("div",{className:`inline-block ${a}`,role:"status","aria-label":"Chargement",children:[(0,t.jsxs)("svg",{className:`animate-spin ${{sm:"w-4 h-4",md:"w-6 h-6",lg:"w-8 h-8"}[e]} ${{blue:"text-blue-600",gray:"text-gray-600",white:"text-white"}[r]} gpu-accelerated`,xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),(0,t.jsx)("span",{className:"sr-only",children:"Chargement..."})]}));a.displayName="LoadingSpinner";var s=e.i(165918);let i=(0,r.memo)(r.default.forwardRef(({variant:e="primary",size:r="md",isLoading:i=!1,className:l="",children:n,disabled:d,...o},c)=>{let u="primary"===e?{backgroundColor:s.colors.button,color:"white"}:{};return(0,t.jsx)("button",{ref:c,className:`
          inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform
          ${{primary:"text-white hover:scale-105",secondary:"bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 hover:scale-105",danger:"bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:scale-105",outline:"border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 hover:scale-105"}[e]}
          ${{sm:"px-3 py-1.5 text-sm",md:"px-4 py-2 text-base",lg:"px-6 py-3 text-lg"}[r]}
          ${l}
        `,style:u,disabled:d||i,...o,children:i?(0,t.jsxs)("span",{className:"flex items-center justify-center",children:[(0,t.jsx)(a,{size:"sm",color:"outline"===e?"gray":"white",className:"mr-2"}),"Chargement..."]}):n})}));i.displayName="Button",e.s(["Button",0,i],833884)},727612,e=>{"use strict";let t=(0,e.i(475254).default)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]]);e.s(["Trash2",()=>t],727612)},636817,e=>{"use strict";var t=e.i(843476),r=e.i(271645);let a=r.default.forwardRef(({label:e,error:a,helperText:s,className:i="",...l},n)=>{let d=r.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("input",{id:o,ref:n,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${a?"border-red-500":"border-gray-300"}
            ${i}
          `,...l}),a&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:a}),s&&!a&&(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:s})]})});a.displayName="Input",r.default.forwardRef(({label:e,error:a,options:s,className:i="",...l},n)=>{let d=r.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("select",{id:o,ref:n,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${a?"border-red-500":"border-gray-300"}
            ${i}
          `,...l,children:s.map(e=>(0,t.jsx)("option",{value:e.value,children:e.label},e.value))}),a&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:a})]})}).displayName="Select",r.default.forwardRef(({label:e,error:a,className:s="",rows:i=4,...l},n)=>{let d=r.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("textarea",{id:o,ref:n,rows:i,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${a?"border-red-500":"border-gray-300"}
            ${s}
          `,...l}),a&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:a})]})}).displayName="Textarea",e.s(["Input",0,a])},286536,e=>{"use strict";let t=(0,e.i(475254).default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);e.s(["Eye",()=>t],286536)},210737,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(178583),s=e.i(107233),i=e.i(727612),l=e.i(286536);let n=(0,e.i(475254).default)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);var d=e.i(339964),o=e.i(833884),c=e.i(159354),u=e.i(636817),m=e.i(61418);let p=[{key:"cabinet_nom",label:"Nom du cabinet",type:"text",required:!0},{key:"cabinet_adresse",label:"Adresse du cabinet",type:"text",required:!0},{key:"cabinet_ville",label:"Ville du cabinet",type:"text",required:!0},{key:"cabinet_code_postal",label:"Code postal",type:"text",required:!0},{key:"cabinet_telephone",label:"Telephone",type:"text"},{key:"cabinet_email",label:"Email",type:"email",required:!0},{key:"date_jour",label:"Date du jour",type:"date",required:!0},{key:"annee",label:"Annee en cours",type:"number",required:!0}],x=[{key:"client_nom",label:"Nom du client",type:"text",required:!0},{key:"client_prenom",label:"Prenom du client",type:"text"},{key:"client_civilite",label:"Civilite (M./Mme)",type:"text"},{key:"client_adresse",label:"Adresse du client",type:"text"},{key:"client_ville",label:"Ville du client",type:"text"},{key:"client_code_postal",label:"Code postal du client",type:"text"},{key:"client_email",label:"Email du client",type:"email"},{key:"client_telephone",label:"Telephone du client",type:"text"}],b=[{key:"dossier_reference",label:"Reference du dossier",type:"text",required:!0},{key:"dossier_titre",label:"Titre du dossier",type:"text"},{key:"dossier_type",label:"Type de dossier",type:"text"},{key:"dossier_description",label:"Description",type:"text"},{key:"dossier_date_ouverture",label:"Date d'ouverture",type:"date"}];function g(e,t){let r=e;return Object.entries(t).forEach(([e,t])=>{let a=RegExp(`{{\\s*${e}\\s*}}`,"g");r=r.replace(a,String(t))}),r}let y=[{nom:"Contrat de prestation de services",categorie:"contrat",description:"Contrat standard pour prestations juridiques",contenu:`CONTRAT DE PRESTATION DE SERVICES

Entre les soussignes :

{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Email : {{cabinet_email}}

Ci-apres denomme "Le Prestataire"

D'une part,

Et :

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}
Email : {{client_email}}

Ci-apres denomme "Le Client"

D'autre part,

IL A eTe CONVENU CE QUI SUIT :

Article 1 - Objet du contrat
Le present contrat a pour objet la realisation de prestations juridiques dans le cadre du dossier {{dossier_reference}}.

Article 2 - Obligations du Prestataire
Le Prestataire s'engage a fournir ses services avec diligence et professionnalisme.

Article 3 - Honoraires
Les honoraires seront factures conformement aux conditions convenues.

Fait a {{cabinet_ville}}, le {{date_jour}}

En deux exemplaires originaux.

Le Prestataire                    Le Client`,variables:[...p,...x,...b]},{nom:"Lettre de mise en demeure",categorie:"mise_en_demeure",description:"Courrier de mise en demeure standard",contenu:`{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}

{{client_ville}}, le {{date_jour}}

LETTRE RECOMMANDeE AVEC ACCUSe DE ReCEPTION

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}

Objet : Mise en demeure - Dossier {{dossier_reference}}

{{client_civilite}},

Par la presente, nous vous mettons en demeure de bien vouloir proceder au reglement de...

[a completer selon les besoins]

a defaut de regularisation sous un delai de 8 jours a compter de la reception de ce courrier, nous nous verrons contraints d'engager les poursuites judiciaires necessaires.

Veuillez agreer, {{client_civilite}}, l'expression de nos salutations distinguees.

{{cabinet_nom}}`,variables:[...p,...x,...b]},{nom:"Attestation de suivi juridique",categorie:"attestation",description:"Attestation pour certifier le suivi d'un dossier",contenu:`ATTESTATION DE SUIVI JURIDIQUE

Je soussigne(e), representant(e) de {{cabinet_nom}}, atteste par la presente que :

{{client_civilite}} {{client_nom}} {{client_prenom}}
Demeurant a {{client_adresse}}, {{client_code_postal}} {{client_ville}}

Fait l'objet d'un suivi juridique par notre cabinet dans le cadre du dossier reference {{dossier_reference}}.

Ce dossier, ouvert le {{dossier_date_ouverture}}, concerne : {{dossier_type}}.

La presente attestation est delivree pour servir et valoir ce que de droit.

Fait a {{cabinet_ville}}, le {{date_jour}}

{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}
Email : {{cabinet_email}}`,variables:[...p,...x,...b]},{nom:"Courrier simple client",categorie:"courrier",description:"Modele de courrier simple pour communication client",contenu:`{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}
Email : {{cabinet_email}}

{{cabinet_ville}}, le {{date_jour}}

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}

Objet : {{dossier_titre}}
Ref. : {{dossier_reference}}

{{client_civilite}},

[Inserer le corps du courrier ici]

Restant a votre disposition pour toute information complementaire, je vous prie d'agreer, {{client_civilite}}, l'expression de mes salutations distinguees.

{{cabinet_nom}}`,variables:[...p,...x,...b]}];function h(){let[e,h]=(0,r.useState)(y.map((e,t)=>({...e,id:`template-${t}`,createdAt:new Date,updatedAt:new Date}))),[v,_]=(0,r.useState)(!1),[f,j]=(0,r.useState)(!1),[N,k]=(0,r.useState)(null),[w,C]=(0,r.useState)({}),[T,A]=(0,r.useState)(""),E=e.filter(e=>e.nom.toLowerCase().includes(T.toLowerCase())||e.description?.toLowerCase().includes(T.toLowerCase())),D=e.reduce((e,t)=>(e[t.categorie]=(e[t.categorie]||0)+1,e),{}),q=e=>({contrat:"Contrat",courrier:"Courrier",mise_en_demeure:"Mise en demeure",attestation:"Attestation",autre:"Autre"})[e]||e;return(0,t.jsxs)("div",{className:"p-6 max-w-7xl mx-auto",children:[(0,t.jsxs)("div",{className:"mb-6",children:[(0,t.jsx)("h1",{className:"text-3xl font-bold text-gray-900 dark:text-white mb-2",children:"Templates de Documents"}),(0,t.jsx)("p",{className:"text-gray-600 dark:text-gray-400",children:"Creez et gerez vos modeles de documents personnalisables"})]}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-5 gap-4 mb-6",children:[(0,t.jsxs)(d.Card,{className:"p-4",children:[(0,t.jsx)("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:e.length}),(0,t.jsx)("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Templates total"})]}),Object.entries(D).map(([e,r])=>(0,t.jsxs)(d.Card,{className:"p-4",children:[(0,t.jsx)("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:r}),(0,t.jsx)("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:q(e)})]},e))]}),(0,t.jsxs)(m.Alert,{variant:"info",className:"mb-6",children:["Les templates utilisent des variables dynamiques comme ",(0,t.jsx)("code",{className:"px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm",children:"{{client_nom}}"})," qui sont automatiquement remplacees lors de la generation."]}),(0,t.jsxs)("div",{className:"flex items-center gap-4 mb-6",children:[(0,t.jsx)(u.Input,{type:"text",placeholder:"Rechercher un template...",value:T,onChange:e=>A(e.target.value),className:"flex-1"}),(0,t.jsxs)(o.Button,{onClick:()=>_(!0),children:[(0,t.jsx)(s.Plus,{className:"h-4 w-4 mr-2"}),"Nouveau Template"]})]}),(0,t.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:E.map(r=>{var s;let o;return(0,t.jsxs)(d.Card,{className:"p-4 hover:shadow-lg transition-shadow",children:[(0,t.jsx)("div",{className:"flex items-start justify-between mb-3",children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)(a.FileText,{className:"h-5 w-5 text-blue-600 dark:text-blue-400"}),(0,t.jsx)("span",{className:`px-2 py-1 text-xs rounded-full ${(s=r.categorie,(o={contrat:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",courrier:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",mise_en_demeure:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",attestation:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",autre:"bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"})[s]||o.autre)}`,children:q(r.categorie)})]})}),(0,t.jsx)("h3",{className:"font-semibold text-gray-900 dark:text-white mb-2",children:r.nom}),r.description&&(0,t.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2",children:r.description}),(0,t.jsxs)("div",{className:"text-xs text-gray-500 dark:text-gray-400 mb-4",children:[r.variables.length," variable(s) disponible(s)"]}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsxs)("button",{onClick:()=>{let e;return k(r),void(C({date_jour:function(e,t){switch(t){case"date":if(e instanceof Date)return e.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});return String(e);case"number":return"number"==typeof e?e.toLocaleString("fr-FR"):String(e);default:return String(e||"")}}(e=new Date,"date"),annee:e.getFullYear(),cabinet_nom:"Cabinet Juridique",cabinet_adresse:"123 Rue du Droit",cabinet_ville:"Paris",cabinet_code_postal:"75001",cabinet_email:"contact@cabinet.fr",cabinet_telephone:"01 23 45 67 89"}),j(!0))},className:"flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors",children:[(0,t.jsx)(l.Eye,{className:"h-4 w-4"}),"Apercu"]}),(0,t.jsx)("button",{onClick:()=>{h([...e,{...r,id:`template-${Date.now()}`,nom:`${r.nom} (copie)`,createdAt:new Date,updatedAt:new Date}])},className:"p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",title:"Dupliquer",children:(0,t.jsx)(n,{className:"h-4 w-4"})}),(0,t.jsx)("button",{onClick:()=>{var t;return t=r.id,void(confirm("Voulez-vous vraiment supprimer ce template ?")&&h(e.filter(e=>e.id!==t)))},className:"p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors",title:"Supprimer",children:(0,t.jsx)(i.Trash2,{className:"h-4 w-4"})})]})]},r.id)})}),0===E.length&&(0,t.jsxs)("div",{className:"text-center py-12",children:[(0,t.jsx)(a.FileText,{className:"h-16 w-16 mx-auto text-gray-400 mb-4"}),(0,t.jsx)("p",{className:"text-gray-600 dark:text-gray-400",children:T?"Aucun template trouve":"Aucun template disponible"})]}),N&&(0,t.jsx)(c.Modal,{isOpen:f,onClose:()=>j(!1),title:`Apercu: ${N.nom}`,children:(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{className:"bg-gray-50 dark:bg-gray-800 p-4 rounded-lg",children:[(0,t.jsx)("h3",{className:"font-semibold mb-3",children:"Variables personnalisables"}),(0,t.jsx)("div",{className:"grid grid-cols-2 gap-3 max-h-96 overflow-y-auto",children:[...p,...x,...b].filter(e=>N.contenu.includes(`{{${e.key}}}`)).map(e=>(0,t.jsxs)("div",{children:[(0,t.jsxs)("label",{className:"block text-sm font-medium mb-1",children:[e.label,e.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)(u.Input,{type:"date"===e.type?"text":e.type,value:w[e.key]||"",onChange:t=>C({...w,[e.key]:t.target.value}),placeholder:e.description})]},e.key))})]}),(0,t.jsxs)("div",{className:"bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700",children:[(0,t.jsx)("h3",{className:"font-semibold mb-3",children:"Apercu du document"}),(0,t.jsx)("div",{className:"prose dark:prose-invert max-w-none",children:(0,t.jsx)("pre",{className:"whitespace-pre-wrap text-sm font-mono",children:g(N.contenu,w)})})]}),(0,t.jsxs)("div",{className:"flex justify-end gap-2",children:[(0,t.jsx)(o.Button,{variant:"secondary",onClick:()=>j(!1),children:"Fermer"}),(0,t.jsx)(o.Button,{onClick:()=>{navigator.clipboard.writeText(g(N.contenu,w)),alert("Document copie dans le presse-papier !")},children:"Copier le document"})]})]})})]})}e.s(["default",()=>h,"dynamic",0,"force-dynamic"],210737)}]);