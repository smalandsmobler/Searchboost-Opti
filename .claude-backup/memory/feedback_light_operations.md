---
name: Håll operationer lätta
description: Undvik tunga parallella API-anrop som fryser användarens dator
type: feedback
---

Kör inte många tunga operationer (curl, API-anrop, AWS CLI) parallellt — det fryser Mikaels dator.

**Why:** Mikael klagade "Kan inte göra något pga du kör så tungt" — systemet bli oanvändbart under tunga sessioner.

**How to apply:** Kör en operation i taget. Ge Mikael kod att klistra in istället för att automatisera allt. Undvik långa curl-kedjor och parallella bash-kommandon.
