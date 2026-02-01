(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,659544,e=>{"use strict";var t=e.i(843476),a=e.i(271645),r=e.i(975157);let s=a.forwardRef(({className:e,variant:a="default",size:s="default",...i},l)=>(0,t.jsx)("button",{className:(0,r.cn)("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",{"bg-primary text-primary-foreground hover:bg-primary/90":"default"===a,"border border-input hover:bg-accent hover:text-accent-foreground":"outline"===a,"hover:bg-accent hover:text-accent-foreground":"ghost"===a,"bg-destructive text-destructive-foreground hover:bg-destructive/90":"destructive"===a},{"h-10 py-2 px-4":"default"===s,"h-9 px-3 rounded-md":"sm"===s,"h-11 px-8 rounded-md":"lg"===s},e),ref:l,...i}));s.displayName="Button",e.s(["Button",()=>s])},815518,e=>{"use strict";e.i(159354),e.s([])},716787,e=>{"use strict";e.i(339964),e.i(738171),e.i(447647),e.i(496640),e.i(473668),e.i(61418),e.i(659544),e.i(815518),e.i(888840),e.i(843476),e.i(964753),e.i(558700),e.s([],716787)},514764,e=>{"use strict";let t=(0,e.i(475254).default)("send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);e.s(["Send",()=>t],514764)},636817,e=>{"use strict";var t=e.i(843476),a=e.i(271645);let r=a.default.forwardRef(({label:e,error:r,helperText:s,className:i="",...l},n)=>{let d=a.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("input",{id:o,ref:n,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${r?"border-red-500":"border-gray-300"}
            ${i}
          `,...l}),r&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:r}),s&&!r&&(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:s})]})});r.displayName="Input",a.default.forwardRef(({label:e,error:r,options:s,className:i="",...l},n)=>{let d=a.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("select",{id:o,ref:n,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${r?"border-red-500":"border-gray-300"}
            ${i}
          `,...l,children:s.map(e=>(0,t.jsx)("option",{value:e.value,children:e.label},e.value))}),r&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:r})]})}).displayName="Select",a.default.forwardRef(({label:e,error:r,className:s="",rows:i=4,...l},n)=>{let d=a.default.useId(),o=l.id||d;return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsxs)("label",{htmlFor:o,className:"block text-sm font-medium text-gray-700 mb-2",children:[e,l.required&&(0,t.jsx)("span",{className:"text-red-500 ml-1",children:"*"})]}),(0,t.jsx)("textarea",{id:o,ref:n,rows:i,className:`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${r?"border-red-500":"border-gray-300"}
            ${s}
          `,...l}),r&&(0,t.jsx)("p",{className:"mt-1 text-sm text-red-600",children:r})]})}).displayName="Textarea",e.s(["Input",0,r])},833884,e=>{"use strict";var t=e.i(843476),a=e.i(271645);let r=(0,a.memo)(({size:e="md",color:a="blue",className:r=""})=>(0,t.jsxs)("div",{className:`inline-block ${r}`,role:"status","aria-label":"Chargement",children:[(0,t.jsxs)("svg",{className:`animate-spin ${{sm:"w-4 h-4",md:"w-6 h-6",lg:"w-8 h-8"}[e]} ${{blue:"text-blue-600",gray:"text-gray-600",white:"text-white"}[a]} gpu-accelerated`,xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),(0,t.jsx)("span",{className:"sr-only",children:"Chargement..."})]}));r.displayName="LoadingSpinner";var s=e.i(165918);let i=(0,a.memo)(a.default.forwardRef(({variant:e="primary",size:a="md",isLoading:i=!1,className:l="",children:n,disabled:d,...o},c)=>{let m="primary"===e?{backgroundColor:s.colors.button,color:"white"}:{};return(0,t.jsx)("button",{ref:c,className:`
          inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform
          ${{primary:"text-white hover:scale-105",secondary:"bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 hover:scale-105",danger:"bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:scale-105",outline:"border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 hover:scale-105"}[e]}
          ${{sm:"px-3 py-1.5 text-sm",md:"px-4 py-2 text-base",lg:"px-6 py-3 text-lg"}[a]}
          ${l}
        `,style:m,disabled:d||i,...o,children:i?(0,t.jsxs)("span",{className:"flex items-center justify-center",children:[(0,t.jsx)(r,{size:"sm",color:"outline"===e?"gray":"white",className:"mr-2"}),"Chargement..."]}):n})}));i.displayName="Button",e.s(["Button",0,i],833884)},164485,e=>{"use strict";e.i(754338),e.i(232768),e.i(888840),e.s([],164485)},564486,e=>{"use strict";e.s(["safeLocalStorage",0,{getItem:e=>localStorage.getItem(e),setItem:(e,t)=>{localStorage.setItem(e,t)},removeItem:e=>{localStorage.removeItem(e)},clear:()=>{localStorage.clear()}}])},207221,e=>{"use strict";e.i(636817),e.i(833884),e.i(159354),e.s([])},788354,e=>{"use strict";var t=e.i(843476),a=e.i(271645),r=e.i(339964);e.i(716787);var s=e.i(964753),i=e.i(61418);e.i(207221);var l=e.i(833884),n=e.i(245423),d=e.i(263488),o=e.i(503116),c=e.i(269638),m=e.i(514764),u=e.i(39312),g=e.i(87316),x=e.i(564486);e.i(247167);var p=e.i(778497);let f={enabled:!0,triggers:{echeances:{enabled:!0,daysBefore:[7,3,1]},facturesOverdue:{enabled:!0,daysAfter:[7,14,30]},weeklySummary:{enabled:!0,dayOfWeek:1,hour:9}}};async function h(e){return p.logger.info("Email simule envoye",{to:e.to.map(e=>e.email),subject:e.template.subject,from:"noreply@iapostemanage.com"}),!0}e.i(164485);var b=e.i(888840);function y(){let{showToast:e}=(0,b.useToast)(),[p,y]=(0,a.useState)(f),[v,j]=(0,a.useState)(!1),w=e=>{y(t=>{let a={...t},r=a;for(let t=0;t<e.length-1;t++)r=r[e[t]];return r[e[e.length-1]]=!r[e[e.length-1]],a})},N=async()=>{j(!0),await new Promise(e=>setTimeout(e,500)),x.safeLocalStorage.setItem("notification_config",JSON.stringify(p)),e("Parametres de notification sauvegardes","success"),j(!1)},k=async t=>{var a,r,s;let i,l,n,d,o;switch(t){case"echeance":a={titre:"Depot des conclusions",date:new Date(Date.now()+2592e5),dossier:"DOS-2026-001",description:"Depot des conclusions au greffe du tribunal"},l="Important",n=`${l}: echeance dans 3 jours - ${a.titre}`,i={subject:n,htmlBody:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Rappel d'echeance</h1>
        </div>

        <!-- Alert Banner -->
        <div style="background-color: #f59e0b; color: white; padding: 15px; text-align: center; font-weight: bold;">
          ️ ${l}: 3 jours restants
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">${a.titre}</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 30%;">[emoji] Date:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">
                  ${a.date.toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">[emoji] Dossier:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${a.dossier}</td>
              </tr>
              ${a.description?`
              <tr>
                <td colspan="2" style="padding: 8px 0; color: #6b7280;">
                  <br>
                  [emoji] Description:<br>
                  <span style="color: #1f2937;">${a.description}</span>
                </td>
              </tr>
              `:""}
            </table>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong style="color: #92400e;">Action requise:</strong>
            <p style="color: #78350f; margin: 8px 0 0 0;">
              N'oubliez pas de traiter cette echeance avant la date limite.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/calendrier" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir le calendrier
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Cet email a ete genere automatiquement par IA Poste Manager<br>
            Pour modifier vos preferences de notification, rendez-vous dans les parametres.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,textBody:`
${l}: echeance dans 3 jours

${a.titre}

Date: ${a.date.toLocaleDateString("fr-FR")}
Dossier: ${a.dossier}
${a.description?`
Description: ${a.description}`:""}

N'oubliez pas de traiter cette echeance avant la date limite.

Voir le calendrier: http://localhost:3000/calendrier
  `.trim()};break;case"facture":r={numero:"FACT-2026-001",client:"Martin Dupont",montant:1500,dateEcheance:new Date(Date.now()-6048e5)},d=`Rappel: Facture ${r.numero} en retard (7 jours)`,i={subject:d,htmlBody:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">️ Facture Impayee</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #1f2937;">Relance de paiement</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            La facture suivante est en retard de paiement depuis <strong>7 jours</strong>:
          </p>

          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Numero:</td>
                <td style="color: #1f2937; font-weight: bold; padding: 5px 0;">${r.numero}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Client:</td>
                <td style="color: #1f2937; font-weight: bold; padding: 5px 0;">${r.client}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Montant:</td>
                <td style="color: #dc2626; font-weight: bold; font-size: 18px; padding: 5px 0;">${r.montant.toFixed(2)} €</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">echeance:</td>
                <td style="color: #1f2937; padding: 5px 0;">${r.dateEcheance.toLocaleDateString("fr-FR")}</td>
              </tr>
            </table>
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            <strong>Actions recommandees:</strong>
          </p>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Contacter le client pour relance</li>
            <li>Verifier le statut de paiement</li>
            <li>Envoyer un rappel de paiement</li>
          </ul>

          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/factures" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir la facture
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            IA Poste Manager - Gestion intelligente de cabinet juridique
          </p>
        </div>
      </div>
    </body>
    </html>
  `,textBody:`
Rappel: Facture ${r.numero} en retard (7 jours)

La facture suivante est en retard de paiement:

Numero: ${r.numero}
Client: ${r.client}
Montant: ${r.montant.toFixed(2)} €
echeance: ${r.dateEcheance.toLocaleDateString("fr-FR")}

Actions recommandees:
- Contacter le client pour relance
- Verifier le statut de paiement
- Envoyer un rappel de paiement

Voir la facture: http://localhost:3000/factures
  `.trim()};break;case"summary":s={newDossiers:5,newFactures:8,totalRevenue:12500,upcomingEcheances:3,overdueFactures:2},o=`Resume hebdomadaire - Semaine du ${new Date().toLocaleDateString("fr-FR")}`,i={subject:o,htmlBody:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">[emoji] Resume Hebdomadaire</h1>
          <p style="color: #dbeafe; margin: 10px 0 0 0;">Semaine du ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Votre activite cette semaine</h2>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #3b82f6; font-size: 32px; font-weight: bold;">${s.newDossiers}</div>
              <div style="color: #1e40af; font-size: 14px; margin-top: 5px;">Nouveaux dossiers</div>
            </div>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #22c55e; font-size: 32px; font-weight: bold;">${s.totalRevenue.toFixed(0)} €</div>
              <div style="color: #16a34a; font-size: 14px; margin-top: 5px;">Chiffre d'affaires</div>
            </div>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #f59e0b; font-size: 32px; font-weight: bold;">${s.upcomingEcheances}</div>
              <div style="color: #d97706; font-size: 14px; margin-top: 5px;">echeances a venir</div>
            </div>
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: #ef4444; font-size: 32px; font-weight: bold;">${s.overdueFactures}</div>
              <div style="color: #dc2626; font-size: 14px; margin-top: 5px;">Factures en retard</div>
            </div>
          </div>

          ${s.overdueFactures>0?`
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong style="color: #991b1b;">️ Action requise:</strong>
            <p style="color: #7f1d1d; margin: 8px 0 0 0;">
              Vous avez ${s.overdueFactures} facture${s.overdueFactures>1?"s":""} en retard de paiement.
            </p>
          </div>
          `:""}

          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Voir le dashboard
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            IA Poste Manager - Resume automatique hebdomadaire<br>
            Pour desactiver ces emails, rendez-vous dans les parametres.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,textBody:`
Resume hebdomadaire - ${new Date().toLocaleDateString("fr-FR")}

Votre activite cette semaine:

[emoji] ${s.newDossiers} nouveaux dossiers
[emoji] ${s.totalRevenue.toFixed(2)} € de chiffre d'affaires
[emoji] ${s.upcomingEcheances} echeances a venir
️ ${s.overdueFactures} factures en retard

Voir le dashboard: http://localhost:3000/dashboard
  `.trim()}}await h({to:[{email:"user@example.com",name:"Utilisateur Test"}],template:i}),e("Email de test envoye (verifiez la console)","success")};return(0,t.jsxs)("div",{className:"p-6 max-w-7xl mx-auto",children:[(0,t.jsx)(s.Breadcrumb,{items:[{label:"Dashboard",href:"/dashboard"},{label:"Parametres",href:"/settings"},{label:"Notifications",href:"/settings/notifications"}]}),(0,t.jsxs)("div",{className:"mb-6",children:[(0,t.jsx)("h1",{className:"text-3xl font-bold text-gray-900 dark:text-white mb-2",children:"Notifications Automatiques"}),(0,t.jsx)("p",{className:"text-gray-600 dark:text-gray-400",children:"Configurez les rappels et alertes par email"})]}),(0,t.jsxs)(i.Alert,{variant:"info",className:"mb-6",children:[(0,t.jsx)(n.Bell,{className:"h-5 w-5"}),"Les notifications sont envoyees automatiquement selon vos preferences. Vous pouvez tester chaque type de notification ci-dessous."]}),(0,t.jsx)(r.Card,{className:"p-6 mb-6",children:(0,t.jsxs)("div",{className:"flex items-center justify-between",children:[(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[(0,t.jsx)("div",{className:`p-4 rounded-full ${p.enabled?"bg-green-100 dark:bg-green-900/30":"bg-gray-100 dark:bg-gray-800"}`,children:p.enabled?(0,t.jsx)(c.CheckCircle,{className:"h-8 w-8 text-green-600 dark:text-green-400"}):(0,t.jsx)(n.Bell,{className:"h-8 w-8 text-gray-400"})}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("h2",{className:"text-xl font-semibold text-gray-900 dark:text-white",children:["Notifications ",p.enabled?"activees":"desactivees"]}),(0,t.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:p.enabled?"Les emails automatiques seront envoyes selon votre configuration":"Aucun email automatique ne sera envoye"})]})]}),(0,t.jsx)("button",{onClick:()=>w(["enabled"]),className:`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${p.enabled?"bg-blue-600":"bg-gray-300 dark:bg-gray-600"}`,children:(0,t.jsx)("span",{className:`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${p.enabled?"translate-x-7":"translate-x-1"}`})})]})}),(0,t.jsxs)(r.Card,{className:"p-6 mb-6",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"p-3 bg-red-100 dark:bg-red-900/30 rounded-lg",children:(0,t.jsx)(o.Clock,{className:"h-6 w-6 text-red-600 dark:text-red-400"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"Rappels d'echeances"}),(0,t.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Recevez des rappels avant les dates limites importantes"})]})]}),(0,t.jsx)("button",{onClick:()=>w(["triggers","echeances","enabled"]),className:`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${p.triggers.echeances.enabled?"bg-blue-600":"bg-gray-300 dark:bg-gray-600"}`,children:(0,t.jsx)("span",{className:`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${p.triggers.echeances.enabled?"translate-x-7":"translate-x-1"}`})})]}),p.triggers.echeances.enabled&&(0,t.jsxs)("div",{className:"space-y-3 pl-12",children:[(0,t.jsx)("p",{className:"text-sm text-gray-700 dark:text-gray-300",children:"Rappels envoyes avant l'echeance:"}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:p.triggers.echeances.daysBefore.map(e=>(0,t.jsxs)("span",{className:"px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm",children:[e," jour",e>1?"s":""," avant"]},e))}),(0,t.jsxs)(l.Button,{variant:"secondary",size:"sm",onClick:()=>k("echeance"),className:"mt-3",children:[(0,t.jsx)(m.Send,{className:"h-4 w-4 mr-2"}),"Tester un rappel"]})]})]}),(0,t.jsxs)(r.Card,{className:"p-6 mb-6",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg",children:(0,t.jsx)(d.Mail,{className:"h-6 w-6 text-orange-600 dark:text-orange-400"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"Relances factures impayees"}),(0,t.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Alertes automatiques pour les factures en retard"})]})]}),(0,t.jsx)("button",{onClick:()=>w(["triggers","facturesOverdue","enabled"]),className:`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${p.triggers.facturesOverdue.enabled?"bg-blue-600":"bg-gray-300 dark:bg-gray-600"}`,children:(0,t.jsx)("span",{className:`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${p.triggers.facturesOverdue.enabled?"translate-x-7":"translate-x-1"}`})})]}),p.triggers.facturesOverdue.enabled&&(0,t.jsxs)("div",{className:"space-y-3 pl-12",children:[(0,t.jsx)("p",{className:"text-sm text-gray-700 dark:text-gray-300",children:"Relances envoyees apres l'echeance:"}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:p.triggers.facturesOverdue.daysAfter.map(e=>(0,t.jsxs)("span",{className:"px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm",children:[e," jour",e>1?"s":""," apres"]},e))}),(0,t.jsxs)(l.Button,{variant:"secondary",size:"sm",onClick:()=>k("facture"),className:"mt-3",children:[(0,t.jsx)(m.Send,{className:"h-4 w-4 mr-2"}),"Tester une relance"]})]})]}),(0,t.jsxs)(r.Card,{className:"p-6 mb-6",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg",children:(0,t.jsx)(g.Calendar,{className:"h-6 w-6 text-purple-600 dark:text-purple-400"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"Resume hebdomadaire"}),(0,t.jsx)("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Synthese de votre activite chaque semaine"})]})]}),(0,t.jsx)("button",{onClick:()=>w(["triggers","weeklySummary","enabled"]),className:`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${p.triggers.weeklySummary.enabled?"bg-blue-600":"bg-gray-300 dark:bg-gray-600"}`,children:(0,t.jsx)("span",{className:`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${p.triggers.weeklySummary.enabled?"translate-x-7":"translate-x-1"}`})})]}),p.triggers.weeklySummary.enabled&&(0,t.jsxs)("div",{className:"space-y-3 pl-12",children:[(0,t.jsxs)("p",{className:"text-sm text-gray-700 dark:text-gray-300",children:["Envoye chaque ",["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][p.triggers.weeklySummary.dayOfWeek]," a ",p.triggers.weeklySummary.hour,"h00"]}),(0,t.jsxs)(l.Button,{variant:"secondary",size:"sm",onClick:()=>k("summary"),className:"mt-3",children:[(0,t.jsx)(m.Send,{className:"h-4 w-4 mr-2"}),"Tester le resume"]})]})]}),(0,t.jsxs)("div",{className:"flex justify-end gap-3",children:[(0,t.jsx)(l.Button,{variant:"secondary",onClick:()=>y(f),children:"Reinitialiser"}),(0,t.jsx)(l.Button,{onClick:N,disabled:v,children:v?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(u.Zap,{className:"h-4 w-4 mr-2 animate-spin"}),"Sauvegarde..."]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.CheckCircle,{className:"h-4 w-4 mr-2"}),"Sauvegarder les parametres"]})})]}),(0,t.jsxs)(r.Card,{className:"p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",children:[(0,t.jsxs)("h4",{className:"font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2",children:[(0,t.jsx)(u.Zap,{className:"h-5 w-5"}),"Mode developpement"]}),(0,t.jsx)("p",{className:"text-sm text-blue-800 dark:text-blue-200 mb-3",children:"Les emails sont actuellement simules (affiches dans la console). En production, ils seront envoyes via un service d'emailing."}),(0,t.jsxs)("div",{className:"text-xs text-blue-700 dark:text-blue-300 space-y-1",children:[(0,t.jsxs)("p",{children:["- ",(0,t.jsx)("strong",{children:"Services recommandes:"})," Resend, SendGrid, AWS SES, Mailgun"]}),(0,t.jsxs)("p",{children:["- ",(0,t.jsx)("strong",{children:"Configuration:"})," Definir la cle API dans les variables d'environnement"]}),(0,t.jsxs)("p",{children:["- ",(0,t.jsx)("strong",{children:"Personnalisation:"})," Les templates HTML peuvent etre modifies dans ",(0,t.jsx)("code",{className:"bg-blue-100 dark:bg-blue-900/50 px-1 rounded",children:"emailService.ts"})]})]})]})]})}e.s(["default",()=>y,"dynamic",0,"force-dynamic"],788354)}]);