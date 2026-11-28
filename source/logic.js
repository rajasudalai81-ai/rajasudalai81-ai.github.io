/**
 * Kadai Tracker — shared ledger + Tamil number logic.
 * Works in the browser (via KadaiLogic) and in Node tests (module.exports).
 * Typing never depends on voice APIs.
 */
(function (root) {
  "use strict";

  const TAMIL_DIGITS = {
    "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4",
    "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9"
  };

  // Longest-first word list: value + kind
  // kind: ones | ten | tensprefix | hundred | thousand | lakh | crore | fraction | scale
  // For forms like இருபத்து / நூற்றி the value is the scale amount and they expect a following ones/tens.
  const WORD_SPECS = [
    // Crores / lakhs
    ["கோடியே", 1e7, "crore"],
    ["கோடி", 1e7, "crore"],
    ["இலட்சத்து", 1e5, "lakh"],
    ["இலட்சத்தி", 1e5, "lakh"],
    ["லட்சத்து", 1e5, "lakh"],
    ["லட்சத்தி", 1e5, "lakh"],
    ["இலட்சம்", 1e5, "lakh"],
    ["லட்சம்", 1e5, "lakh"],
    ["லட்ச", 1e5, "lakh"],

    // 900 is a special word
    ["தொள்ளாயிரத்து", 900, "hundred"],
    ["தொள்ளாயிரத்தி", 900, "hundred"],
    ["தொள்ளாயிரம்", 900, "hundred"],

    // Thousands (compound first)
    ["ஒன்பதாயிரத்து", 9000, "thousand"],
    ["ஒன்பதாயிரத்தி", 9000, "thousand"],
    ["ஒன்பதாயிரம்", 9000, "thousand"],
    ["எட்டாயிரத்து", 8000, "thousand"],
    ["எட்டாயிரத்தி", 8000, "thousand"],
    ["எட்டாயிரம்", 8000, "thousand"],
    ["ஏழாயிரத்து", 7000, "thousand"],
    ["ஏழாயிரத்தி", 7000, "thousand"],
    ["ஏழாயிரம்", 7000, "thousand"],
    ["ஆறாயிரத்து", 6000, "thousand"],
    ["ஆறாயிரத்தி", 6000, "thousand"],
    ["ஆறாயிரம்", 6000, "thousand"],
    ["ஐயாயிரத்து", 5000, "thousand"],
    ["ஐயாயிரத்தி", 5000, "thousand"],
    ["ஐயாயிரம்", 5000, "thousand"],
    ["ஐந்தாயிரத்து", 5000, "thousand"],
    ["ஐந்தாயிரத்தி", 5000, "thousand"],
    ["ஐந்தாயிரம்", 5000, "thousand"],
    ["நான்காயிரத்து", 4000, "thousand"],
    ["நான்காயிரத்தி", 4000, "thousand"],
    ["நான்காயிரம்", 4000, "thousand"],
    ["நாலாயிரத்து", 4000, "thousand"],
    ["நாலாயிரத்தி", 4000, "thousand"],
    ["நாலாயிரம்", 4000, "thousand"],
    ["மூவாயிரத்து", 3000, "thousand"],
    ["மூவாயிரத்தி", 3000, "thousand"],
    ["மூவாயிரம்", 3000, "thousand"],
    ["மூன்றாயிரத்து", 3000, "thousand"],
    ["மூன்றாயிரத்தி", 3000, "thousand"],
    ["மூன்றாயிரம்", 3000, "thousand"],
    ["இரண்டாயிரத்து", 2000, "thousand"],
    ["இரண்டாயிரத்தி", 2000, "thousand"],
    ["இரண்டாயிரம்", 2000, "thousand"],
    ["ரெண்டாயிரத்து", 2000, "thousand"],
    ["ரெண்டாயிரத்தி", 2000, "thousand"],
    ["ரெண்டாயிரம்", 2000, "thousand"],
    ["ஆயிரத்து", 1000, "thousand"],
    ["ஆயிரத்தி", 1000, "thousand"],
    ["ஆயிரம்", 1000, "thousand"],

    // Hundreds (compound)
    ["எண்ணூற்று", 800, "hundred"],
    ["எண்ணூற்றி", 800, "hundred"],
    ["எண்ணூறு", 800, "hundred"],
    ["எழுநூற்று", 700, "hundred"],
    ["எழுநூற்றி", 700, "hundred"],
    ["எழுநூறு", 700, "hundred"],
    ["அறுநூற்று", 600, "hundred"],
    ["அறுநூற்றி", 600, "hundred"],
    ["அறுநூறு", 600, "hundred"],
    ["ஐந்நூற்று", 500, "hundred"],
    ["ஐந்நூற்றி", 500, "hundred"],
    ["ஐந்நூறு", 500, "hundred"],
    ["ஐநூற்று", 500, "hundred"],
    ["ஐநூற்றி", 500, "hundred"],
    ["ஐநூறு", 500, "hundred"],
    ["நாநூற்று", 400, "hundred"],
    ["நாநூற்றி", 400, "hundred"],
    ["நாநூறு", 400, "hundred"],
    ["நானூற்று", 400, "hundred"],
    ["நானூற்றி", 400, "hundred"],
    ["நானூறு", 400, "hundred"],
    ["முந்நூற்று", 300, "hundred"],
    ["முந்நூற்றி", 300, "hundred"],
    ["முந்நூறு", 300, "hundred"],
    ["முன்னூற்று", 300, "hundred"],
    ["முன்னூற்றி", 300, "hundred"],
    ["முன்னூறு", 300, "hundred"],
    ["இருநூற்று", 200, "hundred"],
    ["இருநூற்றி", 200, "hundred"],
    ["இருநூறு", 200, "hundred"],
    ["ஒருநூற்று", 100, "hundred"],
    ["ஒருநூற்றி", 100, "hundred"],
    ["ஒருநூறு", 100, "hundred"],
    ["நூற்று", 100, "hundred"],
    ["நூற்றி", 100, "hundred"],
    ["நூற்து", 100, "hundred"],
    ["நூத்தி", 100, "hundred"],
    ["நூறு", 100, "hundred"],

    // Teens
    ["பத்தொன்பது", 19, "ones"],
    ["பத்தொம்போது", 19, "ones"],
    ["பதினெட்டு", 18, "ones"],
    ["பதினேழு", 17, "ones"],
    ["பதினேலு", 17, "ones"],
    ["பதினாறு", 16, "ones"],
    ["பதினைந்து", 15, "ones"],
    ["பதினஞ்சு", 15, "ones"],
    ["பதினான்கு", 14, "ones"],
    ["பதிநாலு", 14, "ones"],
    ["பதிமூன்று", 13, "ones"],
    ["பதின்மூன்று", 13, "ones"],
    ["பதிமூணு", 13, "ones"],
    ["பன்னிரண்டு", 12, "ones"],
    ["பனிரண்டு", 12, "ones"],
    ["பன்னண்டு", 12, "ones"],
    ["பதினொன்று", 11, "ones"],
    ["பதினொரு", 11, "ones"],
    ["பதினோன்று", 11, "ones"],
    ["பதினொண்ணு", 11, "ones"],

    // Tens complete + connecting forms
    ["தொண்ணூற்று", 90, "tensprefix"],
    ["தொண்ணூற்றி", 90, "tensprefix"],
    ["தொண்ணூறு", 90, "ten"],
    ["எண்பத்து", 80, "tensprefix"],
    ["எண்பத்தி", 80, "tensprefix"],
    ["எண்பது", 80, "ten"],
    ["எழுபத்து", 70, "tensprefix"],
    ["எழுபத்தி", 70, "tensprefix"],
    ["எழுபது", 70, "ten"],
    ["அறுபத்து", 60, "tensprefix"],
    ["அறுபத்தி", 60, "tensprefix"],
    ["அறுபது", 60, "ten"],
    ["ஐம்பத்து", 50, "tensprefix"],
    ["ஐம்பத்தி", 50, "tensprefix"],
    ["ஐம்பது", 50, "ten"],
    ["நாற்பத்து", 40, "tensprefix"],
    ["நாற்பத்தி", 40, "tensprefix"],
    ["நாற்பது", 40, "ten"],
    ["முப்பத்து", 30, "tensprefix"],
    ["முப்பத்தி", 30, "tensprefix"],
    ["முப்பது", 30, "ten"],
    ["இருபத்து", 20, "tensprefix"],
    ["இருபத்தி", 20, "tensprefix"],
    ["இருபது", 20, "ten"],
    ["பத்து", 10, "ten"],
    ["பதின்", 10, "tensprefix"],

    // Fractions (before ones, so அரை is not confused)
    ["முக்கால்", 0.75, "fraction"],
    ["கால்", 0.25, "fraction"],
    ["அரை", 0.5, "fraction"],
    ["பாதி", 0.5, "fraction"],
    ["புள்ளி", 0, "point"],

    // Ones + colloquial
    ["பூஜ்ஜியம்", 0, "ones"],
    ["சுழியம்", 0, "ones"],
    ["சுன்னா", 0, "ones"],
    ["ஒன்பது", 9, "ones"],
    ["ஒம்போது", 9, "ones"],
    ["ஒண்ணு", 1, "ones"],
    ["ஒன்று", 1, "ones"],
    ["ஒன்னு", 1, "ones"],
    ["ஒரு", 1, "ones"],
    ["இரண்டு", 2, "ones"],
    ["ரெண்டு", 2, "ones"],
    ["மூன்று", 3, "ones"],
    ["மூணு", 3, "ones"],
    ["நான்கு", 4, "ones"],
    ["நாலு", 4, "ones"],
    ["ஐந்து", 5, "ones"],
    ["அஞ்சு", 5, "ones"],
    ["ஆறு", 6, "ones"],
    ["ஆரு", 6, "ones"],
    ["ஏழு", 7, "ones"],
    ["எட்டு", 8, "ones"],

    // English words (voice sometimes returns these)
    ["crore", 1e7, "crore"],
    ["lakh", 1e5, "lakh"],
    ["thousand", 1000, "thousand"],
    ["hundred", 100, "hundred"],
    ["ninety", 90, "ten"],
    ["eighty", 80, "ten"],
    ["seventy", 70, "ten"],
    ["sixty", 60, "ten"],
    ["fifty", 50, "ten"],
    ["forty", 40, "ten"],
    ["thirty", 30, "ten"],
    ["twenty", 20, "ten"],
    ["twelve", 12, "ones"],
    ["thirteen", 13, "ones"],
    ["fourteen", 14, "ones"],
    ["fifteen", 15, "ones"],
    ["sixteen", 16, "ones"],
    ["seventeen", 17, "ones"],
    ["eighteen", 18, "ones"],
    ["nineteen", 19, "ones"],
    ["eleven", 11, "ones"],
    ["ten", 10, "ten"],
    ["zero", 0, "ones"],
    ["one", 1, "ones"],
    ["two", 2, "ones"],
    ["three", 3, "ones"],
    ["four", 4, "ones"],
    ["five", 5, "ones"],
    ["six", 6, "ones"],
    ["seven", 7, "ones"],
    ["eight", 8, "ones"],
    ["nine", 9, "ones"],
    ["point", 0, "point"],

    // Tanglish / Romanized Tamil number words
    ["thonnooru", 90, "ten"],
    ["thonnuru", 90, "ten"],
    ["thonnootti", 90, "tensprefix"],
    ["irunootti", 200, "hundred"],
    ["irunooru", 200, "hundred"],
    ["irunuru", 200, "hundred"],
    ["munnooru", 300, "hundred"],
    ["naanooru", 400, "hundred"],
    ["ainooru", 500, "hundred"],
    ["ainnuru", 500, "hundred"],
    ["arunooru", 600, "hundred"],
    ["ezhunooru", 700, "hundred"],
    ["ennooru", 800, "hundred"],
    ["nootti", 100, "hundred"],
    ["nootri", 100, "hundred"],
    ["nootru", 100, "hundred"],
    ["nooru", 100, "hundred"],
    ["aayiram", 1000, "thousand"],
    ["ayiram", 1000, "thousand"],
    ["irubathu", 20, "ten"],
    ["irubadhu", 20, "ten"],
    ["irupadhu", 20, "ten"],
    ["irubathi", 20, "tensprefix"],
    ["muppathu", 30, "ten"],
    ["muppadhu", 30, "ten"],
    ["muppathi", 30, "tensprefix"],
    ["naarpadhu", 40, "ten"],
    ["narpathu", 40, "ten"],
    ["naarbadhu", 40, "ten"],
    ["aimbadhu", 50, "ten"],
    ["aimpathu", 50, "ten"],
    ["aimbathu", 50, "ten"],
    ["aimpathi", 50, "tensprefix"],
    ["arubadhu", 60, "ten"],
    ["arupadhu", 60, "ten"],
    ["ezhubadhu", 70, "ten"],
    ["ezhupathu", 70, "ten"],
    ["enbadhu", 80, "ten"],
    ["enpathu", 80, "ten"],
    ["pathinonnu", 11, "ones"],
    ["pannirendu", 12, "ones"],
    ["pannendu", 12, "ones"],
    ["pathu", 10, "ten"],
    ["paththu", 10, "ten"],
    ["patthu", 10, "ten"],
    ["ondru", 1, "ones"],
    ["onnu", 1, "ones"],
    ["rendu", 2, "ones"],
    ["rendhu", 2, "ones"],
    ["moondru", 3, "ones"],
    ["moonru", 3, "ones"],
    ["moonu", 3, "ones"],
    ["naanku", 4, "ones"],
    ["naalu", 4, "ones"],
    ["aindhu", 5, "ones"],
    ["ainthu", 5, "ones"],
    ["anju", 5, "ones"],
    ["aaru", 6, "ones"],
    ["ezhu", 7, "ones"],
    ["yezhu", 7, "ones"],
    ["ettu", 8, "ones"],
    ["onbadhu", 9, "ones"],
    ["onpathu", 9, "ones"],
    ["ombadhu", 9, "ones"],
    ["iruvathu", 20, "ten"],
    ["naappadhu", 40, "ten"],
    ["embadhu", 80, "ten"],
    ["padhimoonu", 13, "ones"],
    ["padhinaalu", 14, "ones"],
    ["padhinanju", 15, "ones"],
    ["rendaayiram", 2000, "thousand"],
    ["rendayiram", 2000, "thousand"],
    ["irandaayiram", 2000, "thousand"],
    ["moonaayiram", 3000, "thousand"],
    ["anjuayiram", 5000, "thousand"],
    ["arai", 0.5, "fraction"],

    // v7: Tamil compound tens-of-thousands + colloquial / Tirunelveli forms
    ["தொண்ணூறாயிரத்து", 90000, "thousand"], ["தொண்ணூறாயிரம்", 90000, "thousand"],
    ["எண்பதாயிரத்து", 80000, "thousand"], ["எண்பதாயிரம்", 80000, "thousand"], ["எம்பதாயிரம்", 80000, "thousand"],
    ["எழுபதாயிரத்து", 70000, "thousand"], ["எழுபதாயிரம்", 70000, "thousand"], ["எழுவதாயிரம்", 70000, "thousand"],
    ["அறுபதாயிரத்து", 60000, "thousand"], ["அறுபதாயிரம்", 60000, "thousand"], ["அறுவதாயிரம்", 60000, "thousand"],
    ["ஐம்பதாயிரத்து", 50000, "thousand"], ["ஐம்பதாயிரம்", 50000, "thousand"], ["அம்பதாயிரத்து", 50000, "thousand"], ["அம்பதாயிரம்", 50000, "thousand"],
    ["நாற்பதாயிரத்து", 40000, "thousand"], ["நாற்பதாயிரம்", 40000, "thousand"], ["நாப்பதாயிரம்", 40000, "thousand"],
    ["முப்பதாயிரத்து", 30000, "thousand"], ["முப்பதாயிரம்", 30000, "thousand"],
    ["இருபதாயிரத்து", 20000, "thousand"], ["இருபதாயிரம்", 20000, "thousand"], ["இருவதாயிரம்", 20000, "thousand"],
    ["இருபத்தஞ்சாயிரம்", 25000, "thousand"], ["இருபத்தைந்தாயிரம்", 25000, "thousand"],
    ["பதினைந்தாயிரம்", 15000, "thousand"], ["பதினஞ்சாயிரம்", 15000, "thousand"],
    ["பன்னிரண்டாயிரம்", 12000, "thousand"],
    ["பத்தாயிரத்து", 10000, "thousand"], ["பத்தாயிரம்", 10000, "thousand"],
    ["லெட்சம்", 1e5, "lakh"], ["லச்சம்", 1e5, "lakh"], ["லெச்சம்", 1e5, "lakh"],
    ["நூத்தம்பது", 150, "hundred"], ["நூத்தியம்பது", 150, "hundred"],
    ["அஞ்ஞூறு", 500, "hundred"], ["அஞ்சுநூறு", 500, "hundred"], ["எரநூறு", 200, "hundred"], ["எறநூறு", 200, "hundred"],
    ["தொன்னூறு", 90, "ten"], ["தொன்னூத்தி", 90, "tensprefix"],
    ["எம்பது", 80, "ten"], ["எம்பத்தி", 80, "tensprefix"],
    ["எழுவது", 70, "ten"], ["எழுவத்தி", 70, "tensprefix"],
    ["அறுவது", 60, "ten"], ["அறுவத்தி", 60, "tensprefix"],
    ["அம்பது", 50, "ten"], ["அம்பத்தி", 50, "tensprefix"], ["அம்பத்து", 50, "tensprefix"],
    ["நாப்பது", 40, "ten"], ["நாப்பத்தி", 40, "tensprefix"],
    ["முப்பத்தஞ்சு", 35, "ones"], ["இருபத்தஞ்சு", 25, "ones"], ["இருவத்தஞ்சு", 25, "ones"],
    ["இருவது", 20, "ten"], ["இருவத்தி", 20, "tensprefix"],
    ["ஒன்றரை", 1.5, "fraction"], ["ஒன்னரை", 1.5, "fraction"], ["ரெண்டரை", 2.5, "fraction"],
    // Tanglish extras
    ["irubadhayiram", 20000, "thousand"], ["irupathayiram", 20000, "thousand"], ["iruvadhayiram", 20000, "thousand"], ["iruvathayiram", 20000, "thousand"],
    ["muppadhayiram", 30000, "thousand"], ["muppathayiram", 30000, "thousand"],
    ["naarpadhayiram", 40000, "thousand"], ["naappadhayiram", 40000, "thousand"],
    ["aimbadhayiram", 50000, "thousand"], ["ambadhayiram", 50000, "thousand"], ["ambathayiram", 50000, "thousand"],
    ["pathayiram", 10000, "thousand"], ["paththayiram", 10000, "thousand"], ["pathaayiram", 10000, "thousand"],
    ["ambadhu", 50, "ten"], ["ambathu", 50, "ten"], ["ambathi", 50, "tensprefix"],
    ["naappathu", 40, "ten"], ["naapathu", 40, "ten"],
    ["iruvadhu", 20, "ten"],
    ["laksham", 1e5, "lakh"], ["latcham", 1e5, "lakh"], ["lacham", 1e5, "lakh"], ["letcham", 1e5, "lakh"],

    // v7: Hindi (Devanagari, nukta removed before matching)
    ["दो सौ", 200, "hundred"], ["दो हजार", 2000, "thousand"], ["दो लाख", 2e5, "lakh"],
    ["करोड", 1e7, "crore"], ["लाख", 1e5, "lakh"], ["हजार", 1000, "thousand"], ["सौ", 100, "hundred"],
    ["नब्बे", 90, "ten"], ["पचासी", 85, "ones"], ["अस्सी", 80, "ten"], ["पचहत्तर", 75, "ones"], ["सत्तर", 70, "ten"],
    ["पैंसठ", 65, "ones"], ["साठ", 60, "ten"], ["पचपन", 55, "ones"], ["पचास", 50, "ten"], ["पैंतालीस", 45, "ones"],
    ["चालीस", 40, "ten"], ["पैंतीस", 35, "ones"], ["तीस", 30, "ten"], ["पच्चीस", 25, "ones"], ["बीस", 20, "ten"],
    ["उन्नीस", 19, "ones"], ["अठारह", 18, "ones"], ["सत्रह", 17, "ones"], ["सोलह", 16, "ones"], ["पंद्रह", 15, "ones"], ["पन्द्रह", 15, "ones"],
    ["चौदह", 14, "ones"], ["तेरह", 13, "ones"], ["बारह", 12, "ones"], ["ग्यारह", 11, "ones"], ["दस", 10, "ten"],
    ["नौ", 9, "ones"], ["आठ", 8, "ones"], ["सात", 7, "ones"], ["छह", 6, "ones"], ["छः", 6, "ones"], ["पांच", 5, "ones"],
    ["चार", 4, "ones"], ["तीन", 3, "ones"], ["एक", 1, "ones"],
    ["डेढ", 1.5, "fraction"], ["ढाई", 2.5, "fraction"], ["सवा", 1.25, "fraction"],
    // v7: Marathi
    ["कोटी", 1e7, "crore"], ["हजार", 1000, "thousand"],
    ["नऊशे", 900, "hundred"], ["आठशे", 800, "hundred"], ["सातशे", 700, "hundred"], ["सहाशे", 600, "hundred"], ["पाचशे", 500, "hundred"],
    ["चारशे", 400, "hundred"], ["तीनशे", 300, "hundred"], ["दोनशे", 200, "hundred"], ["अडीचशे", 250, "hundred"], ["दीडशे", 150, "hundred"],
    ["शंभर", 100, "hundred"], ["नव्वद", 90, "ten"], ["ऐंशी", 80, "ten"], ["पंच्याहत्तर", 75, "ones"], ["पासष्ट", 65, "ones"],
    ["पंचावन्न", 55, "ones"], ["पन्नास", 50, "ten"], ["पंचेचाळीस", 45, "ones"], ["चाळीस", 40, "ten"], ["पस्तीस", 35, "ones"],
    ["पंचवीस", 25, "ones"], ["वीस", 20, "ten"], ["एकोणीस", 19, "ones"], ["अठरा", 18, "ones"], ["सतरा", 17, "ones"], ["सोळा", 16, "ones"],
    ["पंधरा", 15, "ones"], ["चौदा", 14, "ones"], ["तेरा", 13, "ones"], ["बारा", 12, "ones"], ["अकरा", 11, "ones"], ["दहा", 10, "ten"],
    ["नऊ", 9, "ones"], ["सहा", 6, "ones"], ["पाच", 5, "ones"], ["दोन", 2, "ones"],
    ["दीड", 1.5, "fraction"], ["अडीच", 2.5, "fraction"],
    // v7: Hinglish / Marathi romanized
    ["do sau", 200, "hundred"], ["do hazaar", 2000, "thousand"], ["do hazar", 2000, "thousand"], ["do hajar", 2000, "thousand"], ["do lakh", 2e5, "lakh"],
    ["karod", 1e7, "crore"], ["lac", 1e5, "lakh"], ["laakh", 1e5, "lakh"],
    ["hazaar", 1000, "thousand"], ["hazar", 1000, "thousand"], ["hajaar", 1000, "thousand"], ["hajar", 1000, "thousand"],
    ["sau", 100, "hundred"], ["shambhar", 100, "hundred"], ["shambar", 100, "hundred"],
    ["donshe", 200, "hundred"], ["teenshe", 300, "hundred"], ["paachshe", 500, "hundred"], ["pachshe", 500, "hundred"],
    ["nabbe", 90, "ten"], ["navvad", 90, "ten"], ["assi", 80, "ten"], ["sattar", 70, "ten"], ["saath", 60, "ten"],
    ["pachaas", 50, "ten"], ["pachas", 50, "ten"], ["pannas", 50, "ten"], ["chaalis", 40, "ten"], ["chalis", 40, "ten"], ["chalees", 40, "ten"],
    ["tees", 30, "ten"], ["pachchees", 25, "ones"], ["pachees", 25, "ones"], ["pachis", 25, "ones"], ["panchvees", 25, "ones"],
    ["bees", 20, "ten"], ["vees", 20, "ten"], ["pandrah", 15, "ones"], ["pandhra", 15, "ones"], ["barah", 12, "ones"], ["gyarah", 11, "ones"],
    ["daha", 10, "ten"], ["das", 10, "ten"], ["nau", 9, "ones"], ["aath", 8, "ones"], ["saat", 7, "ones"], ["chhah", 6, "ones"], ["chhe", 6, "ones"], ["saha", 6, "ones"],
    ["paanch", 5, "ones"], ["panch", 5, "ones"], ["paach", 5, "ones"], ["chaar", 4, "ones"], ["char", 4, "ones"], ["teen", 3, "ones"], ["don", 2, "ones"], ["ek", 1, "ones"],
    ["dedh", 1.5, "fraction"], ["dhai", 2.5, "fraction"], ["adich", 2.5, "fraction"], ["deed", 1.5, "fraction"]
  ];

  // Sort longest word first for greedy match
  WORD_SPECS.sort((a, b) => b[0].length - a[0].length);

  const IGNORE_WORDS = new Set([
    "ரூபாய்", "ரூபா", "ருபாய்", "rupees", "rupee", "rs", "inr",
    "மட்டும்", "ம்", "and", "only",
    "கிலோ", "கிலோகிராம்", "kg", "kgs", "kilo", "kilos", "kilogram", "kilograms",
    "லிட்டர்", "லிட்டர்", "liter", "litre", "liters", "litres", "l",
    "கிராம்", "gram", "grams", "g",
    "பொட்டலம்", "packet", "packets", "pck",
    "எண்ணிக்கை", "quantity", "qty",
    "அலகு", "unit", "units"
  ]);

  function normalizeDigits(str) {
    return String(str)
      .replace(/[௦-௯]/g, (ch) => TAMIL_DIGITS[ch] || ch)
      .replace(/[०-९]/g, (ch) => String(ch.charCodeAt(0) - 0x0966));
  }

  // Devanagari spelling variants: drop nukta, precomposed nukta letters -> base,
  // chandrabindu -> anusvara. So हज़ार / हजार and पाँच / पांच match the same word.
  const DEVA_NUKTA_MAP = { "\u0958": "\u0915", "\u0959": "\u0916", "\u095A": "\u0917", "\u095B": "\u091C", "\u095C": "\u0921", "\u095D": "\u0922", "\u095E": "\u092B", "\u095F": "\u092F" };
  function normalizeDeva(str) {
    return String(str)
      .replace(/[\u0958-\u095F]/g, (ch) => DEVA_NUKTA_MAP[ch] || ch)
      .replace(/\u093C/g, "")
      .replace(/\u0901/g, "\u0902");
  }

  function stripNoise(raw) {
    let s = normalizeDeva(normalizeDigits(String(raw || ""))).trim();
    s = s.replace(/[₹]/g, " ");
    s = s.replace(/ரூ\.?/g, " ");
    s = s.replace(/rs\.?/gi, " ");
    s = s.replace(/,/g, "");
    s = s.replace(/[-–—]/g, " - ");
    s = s.replace(/[=]/g, " ");
    s = s.replace(/[()]/g, " ");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  const DEVA_SUFFIXES = new Set(["ला", "चा", "ची", "चे", "च्या", "ने", "ही", "मध्ये", "वर", "नी", "को", "का", "की", "के", "से", "में"]);

  function tokenize(s) {
    const tokens = [];
    let i = 0;
    let lastEnd = -1;
    const lower = s;
    while (i < lower.length) {
      const ch = lower[i];
      if (/\s/.test(ch) || ch === "," || ch === "+") {
        i += 1;
        continue;
      }
      if (ch === "-" && tokens.length === 0) {
        tokens.push({ kind: "sign", value: -1, raw: "-" });
        i += 1;
        continue;
      }
      if (ch === "-") {
        i += 1;
        continue;
      }
      // ASCII number (int or decimal)
      if (/[0-9]/.test(ch) || (ch === "." && i + 1 < lower.length && /[0-9]/.test(lower[i + 1]))) {
        let j = i;
        let num = "";
        while (j < lower.length && /[0-9.]/.test(lower[j])) {
          num += lower[j];
          j += 1;
        }
        const n = Number(num);
        if (!Number.isNaN(n) && num !== ".") {
          tokens.push({ kind: "num", value: n, raw: num });
          i = j;
          continue;
        }
      }
      // Word match (case-insensitive for latin)
      const rest = lower.slice(i);
      const restLower = rest.toLowerCase();
      let matched = false;
      for (const [word, value, kind] of WORD_SPECS) {
        const w = word;
        const chunk = word[0] <= "z" ? restLower : rest;
        if (chunk.startsWith(w)) {
          const after = i + w.length;
          const nextCh = lower[after];
          // Don't match latin word mid-token (e.g. "ten" in "tender")
          if (word[0] <= "z" && nextCh && /[a-zA-Z]/.test(nextCh)) {
            continue;
          }
          // Devanagari: "एक" must not match inside "एकदम". Allow inflection
          // (vowel sign / virama right after) or a short case suffix (शंभरला, हजाराचे).
          if (/[\u0900-\u097F]/.test(word[0]) && nextCh && /[\u0900-\u097F]/.test(nextCh) && !/[\u093E-\u094D]/.test(nextCh)) {
            let k = after;
            while (k < lower.length && /[\u0900-\u097F]/.test(lower[k])) k += 1;
            const tail = lower.slice(after, k);
            if (!DEVA_SUFFIXES.has(tail)) continue;
          }
          // v8: Devanagari number words only at a word start ("चार" is not inside "कर्मचारी")
          if (/[\u0900-\u097F]/.test(word[0]) && i > 0 && /[\u0900-\u097F]/.test(lower[i - 1]) && lastEnd !== i) continue;
          tokens.push({ kind, value, raw: w });
          i = after;
          lastEnd = after;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Skip an ignore word
      let skipped = false;
      const restL = rest.toLowerCase();
      for (const w of IGNORE_WORDS) {
        if (restL.startsWith(w) || rest.startsWith(w)) {
          const after = i + w.length;
          const nextCh = lower[after];
          if (w[0] <= "z" && nextCh && /[a-zA-Z]/.test(nextCh)) continue;
          i = after;
          skipped = true;
          break;
        }
      }
      if (skipped) continue;

      // Skip a single unknown char (punctuation) or consume a tamil/letter chunk
      i += 1;
    }
    return tokens;
  }

  /**
   * Parse Tamil / English / digit number words into a JS number.
   * Returns null if nothing numeric could be read.
   */
  function parseTamilNumber(raw) {
    if (raw == null) return null;
    const text = stripNoise(raw);
    if (!text) return null;

    // Fast path: plain numeric
    const plain = text.replace(/^[+\s]+/, "");
    const sign0 = /^\s*-/.test(text) ? -1 : 1;
    if (/^-?\d+(\.\d+)?$/.test(plain.replace(/^\s*-/, "").trim() ? text.replace(/\s/g, "") : "")) {
      const n = Number(text.replace(/\s/g, ""));
      if (!Number.isNaN(n)) return n;
    }
    if (/^-?\d+(\.\d+)?$/.test(text.replace(/\s/g, ""))) {
      const n = Number(text.replace(/\s/g, ""));
      if (!Number.isNaN(n)) return n;
    }

    const tokens = tokenize(text);
    if (!tokens.length) return null;

    let sign = 1;
    let total = 0;
    let group = 0;
    let current = 0;
    let saw = false;
    let pendingPoint = false;
    let fractionDigits = "";

    function flushCurrent() {
      if (pendingPoint && fractionDigits) {
        current = current + Number("0." + fractionDigits);
        pendingPoint = false;
        fractionDigits = "";
      }
    }

    function addNumber(n) {
      flushCurrent();
      current += n;
      saw = true;
    }

    function applyScale(scale) {
      flushCurrent();
      const base = current === 0 ? 1 : current;
      const piece = base * scale;
      // If scale is smaller than what's already in group in a way that means append? 
      // Standard Indian grouping: when we hit a scale, add to group.
      // If we already have a larger/equal unfinished group? For "ஆயிரத்து நூறு":
      // thousand(1000) then hundred(100) → group 1000 + 100
      if (current === 0 && group > 0 && scale < group) {
        // e.g. already flushed? shouldn't happen
      }
      group += piece;
      current = 0;
      saw = true;
    }

    for (let t = 0; t < tokens.length; t++) {
      const tok = tokens[t];
      if (tok.kind === "sign") {
        sign = tok.value;
        continue;
      }
      if (tok.kind === "point") {
        flushCurrent();
        pendingPoint = true;
        fractionDigits = "";
        saw = true;
        continue;
      }
      if (pendingPoint && (tok.kind === "num" || tok.kind === "ones" || tok.kind === "ten")) {
        // digits after point
        const as = String(tok.value);
        if (/^\d+$/.test(as)) {
          fractionDigits += as;
          saw = true;
          continue;
        }
      }
      if (tok.kind === "fraction") {
        flushCurrent();
        current += tok.value;
        saw = true;
        continue;
      }
      if (tok.kind === "crore") {
        applyScale(1e7);
        continue;
      }
      if (tok.kind === "lakh") {
        applyScale(1e5);
        continue;
      }
      if (tok.kind === "thousand") {
        applyScale(1000);
        continue;
      }
      if (tok.kind === "hundred") {
        applyScale(100);
        // value already includes multiplier for இருநூறு etc. (value is 200, kind hundred)
        // Wait: applyScale uses current * scale. For இருநூறு, value is 200 kind hundred.
        // That's wrong if we treat it as scale 100.
        // Fix: compound hundreds have the full value in `value`.
        // I already pushed {kind:"hundred", value:200} for இருநூறு.
        // applyScale(100) would do (current||1)*100 which is wrong.
        // I'll handle this below by not using generic applyScale for those.
        continue;
      }
      if (tok.kind === "ten" || tok.kind === "tensprefix" || tok.kind === "ones" || tok.kind === "num") {
        addNumber(tok.value);
        continue;
      }
    }
    // The hundred handling above is broken. I'll rewrite the loop more carefully
    // by doing a second implementation below and using that.
    return parseTokens(tokens);
  }

  function parseTokens(tokens) {
    if (!tokens.length) return null;
    let sign = 1;
    let total = 0;
    let group = 0; // between major scales
    let current = 0;
    let saw = false;
    let pendingPoint = false;
    let fractionDigits = "";

    function flushPoint() {
      if (pendingPoint) {
        if (fractionDigits) current += Number("0." + fractionDigits);
        pendingPoint = false;
        fractionDigits = "";
      }
    }

    function takeCurrentOrOne() {
      flushPoint();
      const n = current === 0 ? 1 : current;
      current = 0;
      return n;
    }

    for (const tok of tokens) {
      if (tok.kind === "sign") {
        sign = tok.value;
        continue;
      }
      if (tok.kind === "point") {
        flushPoint();
        pendingPoint = true;
        fractionDigits = "";
        saw = true;
        continue;
      }
      if (pendingPoint && (tok.kind === "num" || tok.kind === "ones" || tok.kind === "ten")) {
        const as = String(tok.value);
        if (/^\d+$/.test(as) && !String(tok.raw || "").includes(".")) {
          fractionDigits += as;
          saw = true;
          continue;
        }
        flushPoint();
      }

      if (tok.kind === "fraction") {
        flushPoint();
        current += tok.value;
        saw = true;
        continue;
      }

      if (tok.kind === "crore") {
        // "கோடி" with optional preceding number; compound not used
        const n = takeCurrentOrOne();
        total += (group + n) * tok.value;
        group = 0;
        saw = true;
        continue;
      }
      if (tok.kind === "lakh") {
        const n = takeCurrentOrOne();
        total += (group + n) * tok.value;
        group = 0;
        saw = true;
        continue;
      }
      if (tok.kind === "thousand") {
        // "ஆயிரம்" (1000) or "இரண்டாயிரம்" (2000)
        flushPoint();
        if (tok.value > 1000 && current === 0) {
          group += tok.value;
        } else if (tok.value > 1000 && current !== 0) {
          // unusual
          group += current;
          current = 0;
          group += tok.value;
        } else {
          const n = current === 0 ? 1 : current;
          current = 0;
          group += n * 1000;
        }
        saw = true;
        continue;
      }
      if (tok.kind === "hundred") {
        flushPoint();
        if (tok.value > 100 && current === 0) {
          // இருநூறு = 200 already
          group += tok.value;
        } else if (tok.value > 100) {
          group += current;
          current = 0;
          group += tok.value;
        } else {
          const n = current === 0 ? 1 : current;
          current = 0;
          group += n * 100;
        }
        saw = true;
        continue;
      }

      if (tok.kind === "ten" || tok.kind === "tensprefix" || tok.kind === "ones" || tok.kind === "num") {
        if (pendingPoint && /^\d+$/.test(String(tok.value))) {
          fractionDigits += String(tok.value);
          saw = true;
          continue;
        }
        flushPoint();
        current += tok.value;
        saw = true;
        continue;
      }
    }
    flushPoint();
    if (!saw) return null;
    const result = sign * (total + group + current);
    // Guard against floating dust
    const rounded = Math.round(result * 1000) / 1000;
    return rounded;
  }

  /**
   * Amount from qty × unit price, or from a bulk reference rate.
   * If refQty and refAmount are provided and refQty !== 0,
   * unit price = refAmount / refQty, amount = qty * unit price.
   */
  function computeAmount({ qty, unitPrice, refQty, refAmount, amountOverride }) {
    if (amountOverride != null && amountOverride !== "" && !Number.isNaN(Number(amountOverride))) {
      // Only use override when explicitly provided; callers decide.
    }
    const q = Number(qty);
    if (refQty != null && refQty !== "" && refAmount != null && refAmount !== "") {
      const rq = Number(refQty);
      const ra = Number(refAmount);
      if (!Number.isNaN(q) && !Number.isNaN(rq) && !Number.isNaN(ra) && rq !== 0) {
        const unit = ra / rq;
        const amt = q * unit;
        return { amount: roundMoney(amt), unitPrice: roundMoney(unit), source: "bulk" };
      }
    }
    const up = Number(unitPrice);
    if (!Number.isNaN(q) && !Number.isNaN(up) && q !== 0 && unitPrice !== "" && unitPrice != null) {
      return { amount: roundMoney(q * up), unitPrice: roundMoney(up), source: "unit" };
    }
    return { amount: null, unitPrice: Number.isNaN(up) ? null : up, source: null };
  }

  function roundMoney(n) {
    if (n == null || Number.isNaN(n)) return n;
    return Math.round(Number(n) * 100) / 100;
  }

  function todayISO(now) {
    const d = now ? new Date(now) : new Date();
    // Asia/Calcutta
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Calcutta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year").value;
    const m = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    return `${y}-${m}-${day}`;
  }

  function normalizeDate(d) {
    if (!d) return todayISO();
    const s = String(d).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return todayISO();
  }

  function newId() {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function defaultMenu() {
    return [
      { id: "idli", nameTa: "இட்லி", nameEn: "Idli", price: 10, unit: "எண்ணிக்கை", costPrice: 3.5 },
      { id: "dosa", nameTa: "தோசை", nameEn: "Dosa", price: 40, unit: "எண்ணிக்கை", costPrice: 12 },
      { id: "vada", nameTa: "வடை", nameEn: "Vada", price: 15, unit: "எண்ணிக்கை", costPrice: 5 },
      { id: "pongal", nameTa: "பொங்கல்", nameEn: "Pongal", price: 40, unit: "எண்ணிக்கை", costPrice: 12 },
      { id: "tea", nameTa: "டீ", nameEn: "Tea", price: 10, unit: "கிளாஸ்", costPrice: 4 },
      { id: "coffee", nameTa: "காபி", nameEn: "Coffee", price: 15, unit: "கிளாஸ்", costPrice: 6 }
    ];
  }

  function normalizePayMode(mode) {
    const s = String(mode || "").trim().toLowerCase();
    if (!s) return "cash";
    if (/^(upi|gpay|phonepe|யூபிஐ|google\s*pay|phope)$/.test(s)) return "upi";
    if (/^(credit|kadan|udhari|கடன்|பாக்கி|baaki|later)$/.test(s)) return "credit";
    if (/^(cash|கேஷ்|ரொக்கம்|cache)$/.test(s)) return "cash";
    return "cash";
  }

  function payModeOf(entry) {
    if (!entry || entry.payMode == null || entry.payMode === "") return "cash";
    return normalizePayMode(entry.payMode);
  }

  function addDaysISO(iso, n) {
    const d = normalizeDate(iso);
    const [y, m, day] = d.split("-").map(Number);
    const dt = new Date(y, m - 1, day + n);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  function startOfWeek(iso) {
    const d = normalizeDate(iso);
    const [y, m, day] = d.split("-").map(Number);
    const dt = new Date(y, m - 1, day);
    const dow = dt.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return addDaysISO(d, diff);
  }

  function endOfWeek(iso) {
    return addDaysISO(startOfWeek(iso), 6);
  }

  function startOfMonth(iso) {
    return normalizeDate(iso).slice(0, 8) + "01";
  }

  function endOfMonth(iso) {
    const d = normalizeDate(iso);
    const [y, m] = d.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  }

  function inRange(date, from, to) {
    const d = normalizeDate(date);
    return d >= from && d <= to;
  }

  function computeTotalsRange(entries, from, to) {
    const fr = normalizeDate(from);
    const toD = normalizeDate(to);
    const subset = (entries || []).filter((e) => e && !e.deleted && inRange(e.date, fr, toD));
    const t = computeTotals(subset, null);
    t.from = fr;
    t.to = toD;
    t.payments = paymentBreakdown(subset, null);
    return t;
  }

  function paymentBreakdown(entries, date) {
    const d = date ? normalizeDate(date) : null;
    const out = { cash: 0, upi: 0, credit: 0, unpaidCredit: 0 };
    for (const e of entries || []) {
      if (!e || e.deleted) continue;
      if (d && e.date !== d) continue;
      if (e.type !== "income") continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt)) continue;
      const pm = payModeOf(e);
      out[pm] = roundMoney((out[pm] || 0) + amt);
      if (pm === "credit" && !e.creditPaid && amt > 0) {
        out.unpaidCredit = roundMoney(out.unpaidCredit + amt);
      }
    }
    return out;
  }

  function nameKey(name) {
    return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function kadanBook(entries) {
    const groups = new Map();
    for (const e of entries || []) {
      if (!e || e.deleted) continue;
      if (e.type !== "income") continue;
      if (payModeOf(e) !== "credit") continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt) || amt <= 0) continue;
      if (e.creditPaid) continue;
      const display = String(e.customerName || "").trim() || "—";
      const key = nameKey(display) || "—";
      if (!groups.has(key)) {
        groups.set(key, { name: display, owed: 0, count: 0, entries: [] });
      }
      const g = groups.get(key);
      g.owed = roundMoney(g.owed + amt);
      g.count += 1;
      g.entries.push({ ...e });
    }
    return [...groups.values()].sort((a, b) => b.owed - a.owed || a.name.localeCompare(b.name));
  }

  function markKadanPaid(entries, customerName) {
    const key = nameKey(customerName);
    const now = new Date().toISOString();
    return (entries || []).map((e) => {
      if (!e || e.deleted) return e;
      if (e.type !== "income" || payModeOf(e) !== "credit" || e.creditPaid) return e;
      const display = String(e.customerName || "").trim() || "—";
      if (nameKey(display) !== key) return e;
      return { ...e, creditPaid: true, creditPaidAt: now, updatedAt: now };
    });
  }

  function topSelling(entries, from, to, limit) {
    const fr = normalizeDate(from);
    const toD = normalizeDate(to);
    const map = new Map();
    for (const e of entries || []) {
      if (!e || e.deleted) continue;
      if (e.type !== "income") continue;
      if (!inRange(e.date, fr, toD)) continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt) || amt <= 0) continue;
      const item = String(e.item || "").trim() || "—";
      const k = nameKey(item);
      if (!map.has(k)) map.set(k, { item, qty: 0, amount: 0, count: 0, unit: String(e.unit || "") });
      const g = map.get(k);
      g.qty += e.qty != null && !Number.isNaN(Number(e.qty)) ? Number(e.qty) : 0;
      g.amount = roundMoney(g.amount + amt);
      g.count += 1;
    }
    return [...map.values()]
      .sort((a, b) => b.amount - a.amount || b.qty - a.qty)
      .slice(0, limit || 8);
  }

  function csvEscape(v) {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV(entries) {
    const header = [
      "Date", "Type", "Item", "Qty", "Unit", "UnitPrice", "Amount",
      "Payment", "Vehicle", "Customer", "CreditPaid", "Note", "QtyUnit", "Category", "Calc"
    ];
    const rows = [header.join(",")];
    const list = (entries || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    for (const e of list) {
      if (!e || e.deleted) continue;
      rows.push([
        e.date,
        e.type,
        csvEscape(e.item),
        e.qty == null ? "" : e.qty,
        csvEscape(e.unit),
        e.unitPrice == null ? "" : e.unitPrice,
        e.amount,
        payModeOf(e),
        csvEscape(e.vehicleNo),
        csvEscape(e.customerName),
        payModeOf(e) === "credit" ? (e.creditPaid ? "yes" : "no") : "",
        csvEscape(e.note),
        csvEscape(qtyUnitLabel(e)),
        csvEscape(e.category || ""),
        csvEscape(e.calc || "")
      ].join(","));
    }
    return "\uFEFF" + rows.join("\n");
  }

  function daySummaryText(entries, date, shopName) {
    const d = normalizeDate(date);
    const t = computeTotals(entries, d);
    const pay = paymentBreakdown(entries, d);
    const top = topSelling(entries, d, d, 5);
    const shop = shopName || "கடை கணக்கு";
    const lines = [
      shop,
      "கணக்கு / Accounts — " + d,
      "",
      "வரவு / Income: ₹" + t.income,
      "செலவு / Expense: ₹" + t.expense,
      "லாபம் / Profit: ₹" + t.profit,
      "",
      "ரொக்கம் / Cash: ₹" + pay.cash,
      "UPI: ₹" + pay.upi,
      "கடன் / Credit: ₹" + pay.credit,
      "நிலுவைக் கடன் / Unpaid credit: ₹" + pay.unpaidCredit
    ];
    if (top.length) {
      lines.push("", "அதிகம் விற்றவை / Top items:");
      top.forEach((x, i) => {
        lines.push(i + 1 + ". " + x.item + " — ₹" + x.amount + (x.qty ? " (" + x.qty + ")" : ""));
      });
    }
    return lines.join("\n");
  }

  const UNIT_ALIASES = [
    { names: ["கிலோகிராம்", "கிலோ", "kilograms", "kilogram", "kilos", "kilo", "kgs", "kg", "किलो", "किलोग्राम", "keelo", "kelo"], unit: "கிலோ", en: "kg" },
    { names: ["கிராம்", "grams", "gram", "gms", "gm", "ग्राम", "ग्रॅम", "graam"], unit: "கிராம்", en: "gram" },
    { names: ["லிட்டர்", "லீட்டர்", "liters", "litres", "liter", "litre", "ltr", "lit", "लीटर", "लिटर"], unit: "லிட்டர்", en: "litre" },
    { names: ["கிளாஸ்", "glasses", "glass", "tumbler", "டம்ளர்", "cup", "cups", "ग्लास", "कप"], unit: "கிளாஸ்", en: "glass" },
    { names: ["பொட்டலம்", "பாக்கெட்", "packets", "packet", "packt", "pck", "pkt", "पैकेट", "पाकीट", "पॅकेट", "paket", "pocket"], unit: "பொட்டலம்", en: "packet" },
    { names: ["டஜன்", "dozens", "dozen", "darjan", "dazan", "darzan", "दर्जन", "डझन", "डजन"], unit: "டஜன்", en: "dozen" },
    { names: ["மூட்டை", "bags", "bag"], unit: "மூட்டை", en: "bag" },
    { names: ["சிலிண்டர்", "cylinders", "cylinder"], unit: "சிலிண்டர்", en: "cylinder" },
    { names: ["பிளேட்", "plates", "plate", "प्लेट"], unit: "பிளேட்", en: "plate" },
    { names: ["எண்ணிக்கை", "எண்ணம்", "பீஸ்", "pieces", "piece", "pcs", "nos", "number", "पीस", "नग"], unit: "எண்ணிக்கை", en: "pcs" }
  ];

  const EXPENSE_ITEMS = [
    { names: ["தக்காளி", "takkaali", "thakkali", "thakkaali", "thakkali", "tomato", "tomatoes", "टमाटर", "टोमॅटो", "टोमाटो", "tamatar", "tamaatar"], nameTa: "தக்காளி", nameEn: "Tomato" },
    { names: ["வெங்காயம்", "vengayam", "venkayam", "onion", "onions", "प्याज", "कांदा", "कांदे", "pyaz", "pyaaz", "pyaj", "kanda"], nameTa: "வெங்காயம்", nameEn: "Onion" },
    { names: ["மாவு", "maavu", "maavu", "flour", "atta", "आटा", "पीठ", "aata"], nameTa: "மாவு", nameEn: "Flour" },
    { names: ["டீசல்", "diesel", "डीजल", "डिझेल", "डीझेल"], nameTa: "டீசல்", nameEn: "Diesel" },
    { names: ["பெட்ரோல்", "petrol", "पेट्रोल"], nameTa: "பெட்ரோல்", nameEn: "Petrol" },
    { names: ["வாயு சிலிண்டர்", "gas cylinder", "சிலிண்டர்", "cylinder", "வாயு", "gas", "கேஸ்", "गैस", "गॅस", "सिलेंडर", "सिलिंडर"], nameTa: "வாயு சிலிண்டர்", nameEn: "Gas cylinder" },
    { names: ["அரிசி", "arisi", "rice", "चावल", "तांदूळ", "तांदुळ", "chawal", "chaawal", "tandul"], nameTa: "அரிசி", nameEn: "Rice" },
    { names: ["உளுந்து", "ulundhu", "ulundu", "उडद", "उडीद", "urad"], nameTa: "உளுந்து", nameEn: "Urad dal" },
    { names: ["எண்ணெய்", "ennai", "oil", "तेल"], nameTa: "எண்ணெய்", nameEn: "Oil" },
    { names: ["சீனி", "சர்க்கரை", "சக்கரை", "seeni", "sakkarai", "sarkkarai", "sugar", "चीनी", "शक्कर", "साखर", "cheeni", "chini", "shakkar", "sakhar"], nameTa: "சீனி", nameEn: "Sugar" },
    { names: ["டீ தூள்", "டீத்தூள்", "டீ பவுடர்", "tea powder", "tea thool", "tea thul", "chai patti", "chai patti", "chaipatti", "चाय पत्ती", "चायपत्ती", "चहा पावडर", "चहापत्ती", "chaha pavdar"], nameTa: "டீ தூள்", nameEn: "Tea powder" },
    { names: ["காபி தூள்", "காபித்தூள்", "coffee powder", "coffee thool", "कॉफी पाउडर", "कॉफी पावडर"], nameTa: "காபி தூள்", nameEn: "Coffee powder" },
    { names: ["உருளைக்கிழங்கு", "உருளை", "urulai", "potato", "potatoes", "aloo", "alu", "आलू", "बटाटा", "batata"], nameTa: "உருளைக்கிழங்கு", nameEn: "Potato" },
    { names: ["மிளகாய்", "milagai", "chilli", "chillies", "chili", "mirchi", "मिर्च", "मिर्ची", "मिरची"], nameTa: "மிளகாய்", nameEn: "Chilli" },
    { names: ["தேங்காய்", "thengai", "thenga", "coconut", "nariyal", "नारियल", "नारळ", "naral"], nameTa: "தேங்காய்", nameEn: "Coconut" },
    { names: ["முட்டை", "muttai", "egg", "eggs", "anda", "ande", "अंडा", "अंडे", "अंडी"], nameTa: "முட்டை", nameEn: "Eggs" },
    { names: ["கொத்தமல்லி", "kothamalli", "coriander", "dhaniya", "धनिया", "कोथिंबीर", "kothimbir"], nameTa: "கொத்தமல்லி", nameEn: "Coriander" },
    { names: ["காய்கறி", "kaaykari", "vegetable", "vegetables", "सब्जी", "भाजी", "sabzi", "sabji", "subzi"], nameTa: "காய்கறி", nameEn: "Vegetables" },
    { names: ["பால்", "paal", "paal", "milk", "दूध", "दुध", "doodh", "dudh"], nameTa: "பால்", nameEn: "Milk", ambiguous: true },
    { names: ["வாடகை", "vaadagai", "rent", "किराया", "भाडे", "भाड़ा", "kiraya", "kiraaya", "bhade"], nameTa: "வாடகை", nameEn: "Rent" },
    { names: ["தண்ணீர்", "thanneer", "water", "पानी", "पाणी", "paani"], nameTa: "தண்ணீர்", nameEn: "Water" }
  ];

  const TYPE_EXPENSE_RE = /(?:செலவு|selavu|selavu|expense|expenses|vaangunadhu|vaangunaathu|vaangunathu|vaanguna|vaanginen|vaangitten|வாங்குனது|வாங்கினேன்|வாங்கியது|வாங்கினது|spent|purchase|kharcha|கர்ச்சு)/i;
  const TYPE_INCOME_RE = /(?:வரவு|varavu|vithadhu|viththadhu|vittadhu|kuduthen|kuduthaen|kuduthen|கொடுத்தேன்|விற்றது|sales?|income|விற்பனை|விற்றேன்|sold)/i;
  const MINUS_RE = /(?:minus|மைனஸ்|கழிவு|சரிகட்டு|discount|தள்ளுபடி|refund|திருப்பம்|negative)/i;
  const PAY_UPI_RE = /(?:\bupi\b|யூபிஐ|gpay|phonepe|google\s*pay)/i;
  const PAY_CREDIT_RE = /(?:\bcredit\b|கடன்|kadan|udhari|பாக்கி|baaki|\blater\b)/i;
  const PAY_CASH_RE = /(?:\bcash\b|கேஷ்|ரொக்கம்)/i;
  const VEHICLE_RE = /(?:vandi|vaandi|vehicle|vaahanam|வாகன(?:ம்)?(?:\s*எண்)?)\s*[:\-]?\s*([A-Za-z]{2}\s*-?\s*\d{1,2}\s*-?\s*[A-Za-z]{1,3}\s*-?\s*\d{1,4})|(\b[A-Za-z]{2}\s*-?\s*\d{1,2}\s*-?\s*[A-Za-z]{1,3}\s*-?\s*\d{1,4}\b)/i;

  function normalizeVehicle(raw) {
    if (!raw) return "";
    return String(raw).replace(/[\s-]+/g, "").toUpperCase();
  }

  function escapeReg(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function findAlias(list, text) {
    const lower = text.toLowerCase();
    let best = null;
    for (const row of list) {
      for (const n of row.names) {
        const re = new RegExp(n.charCodeAt(0) < 128 ? "\\b" + escapeReg(n) + "\\b" : escapeReg(n), "i");
        if (re.test(n.charCodeAt(0) < 128 ? lower : text) || lower.includes(n.toLowerCase()) || text.indexOf(n) !== -1) {
          if (!best || n.length > best.len) best = { row, len: n.length, raw: n };
        }
      }
    }
    return best;
  }

  function stripPhrase(text, phrase) {
    if (!phrase) return text;
    const re = new RegExp(phrase.charCodeAt(0) < 128 ? "\\b" + escapeReg(phrase) + "\\b" : escapeReg(phrase), "ig");
    return text.replace(re, " ");
  }

  function menuAliases(menu) {
    const list = [];
    const src = menu && menu.length ? menu : defaultMenu();
    const extras = {
      dosa: ["தோசை", "dosai", "thosai", "thosa", "dose", "dosai", "डोसा", "दोसा", "डोसे", "dhosa"],
      idli: ["இட்லி", "இட்ளி", "idly", "itli", "iddly", "iddli", "idlee", "इडली", "इडली", "इटली", "idali"],
      tea: ["டீ", "தேநீர்", "tee", "chaya", "chaaya", "chai", "saya", "சாய்", "चाय", "चहा", "chay", "chaay", "chaha"],
      coffee: ["காபி", "கோபி", "kaapi", "kapi", "kopi", "cafe", "kofi", "कॉफी", "कोफी", "काफी", "कॉफ़ी", "kaafi"],
      vada: ["வடை", "vadai", "wada", "vadai", "वडा", "वडे"],
      pongal: ["பொங்கல்", "pongal", "ven pongal", "venpongal", "पोंगल"]
    };
    for (const m of src) {
      const names = [m.nameTa, m.nameEn, m.id].filter(Boolean);
      if (extras[m.id]) names.push.apply(names, extras[m.id]);
      list.push({ names, nameTa: m.nameTa, nameEn: m.nameEn, price: m.price, unit: m.unit, id: m.id, menu: true });
    }
    return list;
  }

  function extractNumbersInOrder(text) {
    // Walk the string extracting numeric tokens (digits or number words) left to right,
    // skipping already-consumed ranges via parse of maximal phrases.
    const tokens = [];
    const s = String(text || "");
    let i = 0;
    while (i < s.length) {
      if (/\s/.test(s[i])) { i += 1; continue; }
      // digits
      if (/[0-9௦-௯०-९]/.test(s[i]) || (s[i] === "-" && i + 1 < s.length && /[0-9]/.test(s[i + 1]))) {
        let j = i + (s[i] === "-" ? 1 : 0);
        while (j < s.length && /[0-9௦-௯०-९.,]/.test(s[j])) j += 1;
        // trailing "." or "," is punctuation, not part of the number
        while (j > i + 1 && /[.,]/.test(s[j - 1])) j -= 1;
        let n = parseTamilNumber(s.slice(i, j));
        let end = j;
        // "20 हजार" / "5 ஆயிரம்" / "20 thousand" / "20k": digits followed by a scale word
        const after = s.slice(j);
        const kMatch = after.match(/^\s*k\b/i);
        if (n != null && kMatch) {
          n = n * 1000;
          end = j + kMatch[0].length;
        } else if (n != null) {
          const w = after.match(/^\s*([A-Za-z\u0B80-\u0BFF\u0900-\u097F]+)/);
          if (w) {
            const toks = tokenize(stripNoise(w[1]));
            if (toks.length === 1 && /^(hundred|thousand|lakh|crore)$/.test(toks[0].kind) && toks[0].value <= 1e7 && [100, 1000, 1e5, 1e7].indexOf(toks[0].value) !== -1) {
              n = n * toks[0].value;
              end = j + w[0].length;
            }
          }
        }
        if (n != null) tokens.push({ value: n, start: i, end: end, raw: s.slice(i, end) });
        i = end;
        continue;
      }
      // Try to parse a number-word sequence from here
      let j = i;
      // consume letters (latin or tamil)
      while (j < s.length && /[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(s[j])) j += 1;
      // extend over following number words (nooru aimbadhu)
      let end = j;
      let k = j;
      while (k < s.length) {
        if (/\s/.test(s[k])) { k += 1; continue; }
        let p = k;
        while (p < s.length && /[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(s[p])) p += 1;
        if (p === k) break;
        const piece = s.slice(k, p);
        if (parseTamilNumber(piece) != null) {
          end = p;
          k = p;
          continue;
        }
        break;
      }
      const chunk = s.slice(i, end);
      const n = parseTamilNumber(chunk);
      if (n != null && /[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(chunk)) {
        tokens.push({ value: n, start: i, end: end, raw: chunk });
        i = end;
        continue;
      }
      i += 1;
    }
    return tokens;
  }

  /**
   * Parse a one-shot spoken or typed sentence into a ledger entry draft.
   * Same function is used for the big mic and the typed quick-entry box.
   */
  function parseUtterance(text, options) {
    const raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "empty", raw: "" };
    const menu = (options && options.menu) || defaultMenu();
    let work = raw.replace(/\s+/g, " ");

    let vehicleNo = "";
    const vMatch = work.match(VEHICLE_RE);
    if (vMatch) {
      vehicleNo = normalizeVehicle(vMatch[1] || vMatch[2] || "");
      work = work.replace(vMatch[0], " ");
    }

    const negative = MINUS_RE.test(work);
    let payMode = "cash";
    if (PAY_CREDIT_RE.test(work)) payMode = "credit";
    else if (PAY_UPI_RE.test(work)) payMode = "upi";
    else if (PAY_CASH_RE.test(work)) payMode = "cash";

    let typeHint = null;
    if (TYPE_EXPENSE_RE.test(work)) typeHint = "expense";
    else if (TYPE_INCOME_RE.test(work)) typeHint = "income";
    if (vehicleNo && !typeHint) typeHint = "expense";

    const saleHit = findAlias(menuAliases(menu), work);
    const expHit = findAlias(EXPENSE_ITEMS, work);
    const unitHit = findAlias(UNIT_ALIASES, work);

    let item = "";
    let itemEn = "";
    let menuPrice = null;
    let menuUnit = "";
    if (saleHit && (!expHit || saleHit.len >= expHit.len)) {
      item = saleHit.row.nameTa;
      itemEn = saleHit.row.nameEn;
      menuPrice = saleHit.row.price != null ? Number(saleHit.row.price) : null;
      menuUnit = saleHit.row.unit || "";
    } else if (expHit) {
      item = expHit.row.nameTa;
      itemEn = expHit.row.nameEn;
    }

    let type = typeHint;
    if (!type) {
      if (expHit && (!saleHit || expHit.len > saleHit.len)) type = "expense";
      else if (saleHit) type = "income";
      else if (unitHit && (unitHit.row.unit === "கிலோ" || unitHit.row.unit === "லிட்டர்" || unitHit.row.unit === "சிலிண்டர்")) type = "expense";
      else if (negative) type = "income";
      else type = "income";
    }

    // Strip known keywords to find leftover name / note
    let leftover = work;
    leftover = leftover.replace(TYPE_EXPENSE_RE, " ");
    leftover = leftover.replace(TYPE_INCOME_RE, " ");
    leftover = leftover.replace(PAY_UPI_RE, " ");
    leftover = leftover.replace(PAY_CREDIT_RE, " ");
    leftover = leftover.replace(PAY_CASH_RE, " ");
    leftover = leftover.replace(MINUS_RE, " ");
    leftover = leftover.replace(/\b(?:vandi|vaandi|vehicle|vaahanam)\b/gi, " ");
    leftover = leftover.replace(/வாகன(?:ம்)?(?:\s*எண்)?/g, " ");
    if (saleHit) leftover = stripPhrase(leftover, saleHit.raw);
    if (expHit) leftover = stripPhrase(leftover, expHit.raw);
    if (unitHit) leftover = stripPhrase(leftover, unitHit.raw);
    leftover = leftover.replace(/ரூவா|ரூபாய்|ரூபா|ருபாய்|rupees?|ruva|ruwa|ruvaa|rs\.?|inr|₹/gi, " ");

    const nums = extractNumbersInOrder(work);
    let qty = null;
    let unitPrice = null;
    let amount = null;

    if (nums.length >= 2) {
      qty = nums[0].value;
      const priceNum = nums[1].value;
      const isSale = type === "income" && saleHit;
      if (isSale) {
        unitPrice = priceNum;
        amount = roundMoney(qty * unitPrice);
      } else {
        // Market talk: "tomato 3 kg 90 rupees" is a total
        amount = priceNum;
        if (qty) unitPrice = roundMoney(amount / qty);
      }
    } else if (nums.length === 1) {
      if (saleHit && type === "income" && menuPrice != null && !negative) {
        // "tea 20" → 20 teas at menu price? or total 20?
        // If unit present or number is small-ish qty, treat as qty.
        // If only "tea 20" without unit, could be qty 20 at menu price.
        qty = nums[0].value;
        unitPrice = menuPrice;
        amount = roundMoney(qty * unitPrice);
      } else {
        amount = nums[0].value;
      }
    } else if (saleHit && type === "income" && menuPrice != null && !negative) {
      qty = 1;
      unitPrice = menuPrice;
      amount = menuPrice;
    }

    if (negative && amount != null && amount > 0) amount = roundMoney(-amount);
    if (negative && unitPrice != null && amount == null) {
      amount = roundMoney(-Math.abs(unitPrice));
      unitPrice = null;
      qty = null;
    }

    const unit = (unitHit && unitHit.row.unit) || menuUnit || (type === "income" ? "எண்ணிக்கை" : "");

    // Customer name: leftover words that aren't numbers
    let customerName = "";
    let noteParts = [];
    const leftoverClean = leftover.replace(/[0-9௦-௯.,\-]+/g, " ").replace(/\s+/g, " ").trim();
    // remove leftover number-words
    let nameBits = leftoverClean;
    // strip remaining number words by iterating known short leftovers
    const bits = leftoverClean.split(/\s+/).filter(Boolean);
    const words = [];
    for (const b of bits) {
      if (parseTamilNumber(b) != null) continue;
      if (/^(rupees?|rs|inr|only|and|the|a|an|of|for|to|at|per|each|ஒன்றுக்கு|கிலோவுக்கு|க்கு)$/i.test(b)) continue;
      words.push(b);
    }
    if (payMode === "credit" && words.length) {
      customerName = words.join(" ");
    } else if (words.length) {
      if (!item) {
        if (negative) {
          item = "சரிகட்டு";
          itemEn = "Adjustment";
          noteParts = words;
        } else {
          item = words.join(" ");
        }
      } else {
        noteParts = words;
      }
    }

    if (negative) {
      const disc = raw.match(MINUS_RE);
      if (disc && noteParts.join(" ").toLowerCase().indexOf(String(disc[0]).toLowerCase()) === -1) {
        noteParts.unshift(disc[0]);
      }
      if (!item) {
        item = "சரிகட்டு";
        itemEn = "Adjustment";
      }
    }

    const note = noteParts.join(" ").trim();

    if (amount == null) {
      return attachUncertainty({
        ok: false, error: "no-amount", raw, type, item, itemEn, qty, unit, unitPrice,
        amount, vehicleNo, note, payMode, customerName, negative,
        confidence: "low"
      }, { typeHint, saleHit, expHit, usedMenuPrice: false, numsLength: nums.length, speechConfidence: options && options.speechConfidence });
    }

    const usedMenuPrice = !!(saleHit && type === "income" && menuPrice != null && (nums.length <= 1) && !negative);
    return attachUncertainty({
      ok: true,
      raw,
      type,
      item: item || "",
      itemEn: itemEn || "",
      qty,
      unit,
      unitPrice,
      amount: roundMoney(amount),
      vehicleNo,
      note,
      payMode,
      customerName,
      negative,
      confidence: typeHint || saleHit || expHit ? "high" : "medium"
    }, {
      typeHint,
      saleHit,
      expHit,
      usedMenuPrice,
      numsLength: nums.length,
      speechConfidence: options && options.speechConfidence,
      ambiguousItem: !!(expHit && expHit.row && expHit.row.ambiguous && !typeHint)
    });
  }

  function attachUncertainty(parsed, ctx) {
    ctx = ctx || {};
    const uncertain = {};
    const reasons = [];
    const knownItem = !!(ctx.saleHit || ctx.expHit);
    if (!ctx.typeHint && (!knownItem || ctx.ambiguousItem)) {
      uncertain.type = true;
      reasons.push(ctx.ambiguousItem ? "item-ambiguous" : "type-unstated");
    }
    if (!parsed.item) {
      uncertain.item = true;
      reasons.push("missing-item");
    } else if (!knownItem && parsed.item !== "சரிகட்டு") {
      uncertain.item = true;
      reasons.push("unknown-item");
    }
    if (ctx.usedMenuPrice) {
      uncertain.unitPrice = true;
      reasons.push("price-from-menu");
    }
    if (parsed.ok === false || parsed.amount == null) {
      uncertain.amount = true;
      reasons.push("missing-price");
    }
    if (ctx.numsLength === 1 && ctx.saleHit && ctx.usedMenuPrice) {
      uncertain.qty = true;
      reasons.push("number-ambiguous");
    }
    if (ctx.speechConfidence != null && ctx.speechConfidence > 0 && ctx.speechConfidence < 0.7) {
      uncertain.speech = true;
      reasons.push("low-speech-confidence");
    }
    parsed.uncertain = uncertain;
    parsed.uncertaintyReasons = reasons;
    parsed.needsCheck = reasons.length > 0;
    if (ctx.speechConfidence != null) parsed.speechConfidence = ctx.speechConfidence;
    return parsed;
  }

  function allItemCatalog(menu) {
    const list = [];
    menuAliases(menu).forEach((row) => {
      list.push({ names: row.names, nameTa: row.nameTa, nameEn: row.nameEn, price: row.price, unit: row.unit, id: row.id, kind: "sale", menu: true });
    });
    EXPENSE_ITEMS.forEach((row) => {
      list.push({ names: row.names, nameTa: row.nameTa, nameEn: row.nameEn, kind: "expense", ambiguous: !!row.ambiguous });
    });
    return list;
  }

  function findAllItemHits(text, menu) {
    const raw = String(text || "");
    const lower = raw.toLowerCase();
    const catalog = allItemCatalog(menu);
    const cands = [];
    for (const row of catalog) {
      for (const n of row.names) {
        if (!n) continue;
        const isLatin = n.charCodeAt(0) < 128;
        const re = new RegExp(isLatin ? "\\b" + escapeReg(n) + "\\b" : escapeReg(n), "ig");
        const hay = isLatin ? lower : raw;
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(hay))) {
          cands.push({ start: m.index, end: m.index + m[0].length, len: m[0].length, raw: raw.slice(m.index, m.index + m[0].length), row: row });
          if (m.index === re.lastIndex) re.lastIndex += 1;
        }
      }
    }
    cands.sort((a, b) => b.len - a.len || a.start - b.start);
    const taken = [];
    for (const c of cands) {
      if (taken.some((t) => !(c.end <= t.start || c.start >= t.end))) continue;
      taken.push(c);
    }
    taken.sort((a, b) => a.start - b.start);
    return taken;
  }

  function extractGlobals(text) {
    const work = String(text || "");
    let vehicleNo = "";
    const vMatch = work.match(VEHICLE_RE);
    if (vMatch) vehicleNo = normalizeVehicle(vMatch[1] || vMatch[2] || "");
    let payMode = "cash";
    if (PAY_CREDIT_RE.test(work)) payMode = "credit";
    else if (PAY_UPI_RE.test(work)) payMode = "upi";
    let typeHint = null;
    if (TYPE_EXPENSE_RE.test(work)) typeHint = "expense";
    else if (TYPE_INCOME_RE.test(work)) typeHint = "income";
    const customerBits = [];
    if (payMode === "credit") {
      const p = parseUtterance(work);
      if (p && p.customerName) customerBits.push(p.customerName);
    }
    return { vehicleNo, payMode, typeHint, negative: MINUS_RE.test(work), customerName: customerBits[0] || "" };
  }

  function splitAroundItems(text, hits) {
    const nums = extractNumbersInOrder(text);
    const chunks = [];
    for (let i = 0; i < hits.length; i++) {
      const prevEnd = i === 0 ? 0 : hits[i - 1].end;
      const nextStart = i + 1 < hits.length ? hits[i + 1].start : text.length;
      // include a leading number after previous item and before this item
      let start = hits[i].start;
      for (const n of nums) {
        if (n.start >= prevEnd && n.end <= hits[i].start) start = Math.min(start, n.start);
      }
      let end = nextStart;
      // do not swallow the next item's leading number
      if (i + 1 < hits.length) {
        for (const n of nums) {
          if (n.start >= hits[i].end && n.end <= hits[i + 1].start) {
            end = Math.min(end, n.start);
            break;
          }
        }
      }
      const chunk = text.slice(start, end).trim();
      if (chunk) chunks.push({ text: chunk, hit: hits[i] });
    }
    return chunks;
  }

  const PAIR_EXPENSE_WORDS = [
    "கழிச்சேன்", "கழித்தேன்", "கழிச்சு",
    "kazhichen", "kazhichchaen", "kazhichu", "kazhichchu", "kazhi",
    "கழி",
    "போய்விட்டது", "போயிற்று", "போனது", "போச்சு",
    "poyiduchu", "poyichu", "ponathu", "ponadhu", "pochchu", "pochu",
    "வாங்கினேன்", "வாங்குனேன்", "வாங்கியது", "வாங்கினது", "வாங்குனது", "வாங்கி",
    "vaangitten", "vaanginen", "vaangunen", "vaangunadhu", "vaangunaathu", "vaangi",
    "spent"
  ];
  const PAIR_INCOME_WORDS = [
    "வந்துச்சு", "வந்தது", "வருகிறது", "வருது",
    "vandhuchu", "vanthuchu", "vanduchu", "vandhuthu", "varudhu", "varuthu",
    "வித்தேன்", "விற்றேன்",
    "viththen", "viththuten", "vittuten", "vithen"
  ];
  const PAIR_FILLER_RE = /^(?:ரூவா|ரூபாய்|ரூபா|ருபாய்|rupees?|ruva|ruwa|ruvaa|rs\.?|inr|₹|ku|kku|க்கு)+$/i;

  function findWordHits(text, words) {
    const raw = String(text || "");
    const lower = raw.toLowerCase();
    const cands = [];
    const sorted = words.slice().sort((a, b) => b.length - a.length);
    for (const n of sorted) {
      if (!n) continue;
      const isLatin = n.charCodeAt(0) < 128;
      const re = new RegExp(isLatin ? "\\b" + escapeReg(n) + "\\b" : escapeReg(n), "ig");
      const hay = isLatin ? lower : raw;
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(hay))) {
        if (n === "கழி" && raw.slice(m.index, m.index + 4) === "கழிவு") continue;
        cands.push({ start: m.index, end: m.index + m[0].length, len: m[0].length, raw: raw.slice(m.index, m.index + m[0].length), word: n });
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }
    cands.sort((a, b) => b.len - a.len || a.start - b.start);
    const taken = [];
    for (const c of cands) {
      if (taken.some((t) => !(c.end <= t.start || c.start >= t.end))) continue;
      taken.push(c);
    }
    taken.sort((a, b) => a.start - b.start);
    return taken;
  }

  function isPairFiller(text, from, to) {
    const mid = String(text || "").slice(from, to).replace(/\s+/g, "").trim();
    return mid === "" || PAIR_FILLER_RE.test(mid);
  }

  function amountNearestBefore(verbStart, nums, text) {
    let best = null;
    for (const n of nums) {
      if (n.end <= verbStart && isPairFiller(text, n.end, verbStart)) best = n;
    }
    return best;
  }

  /**
   * Shop talk that names both what went out and what came in, in one sentence.
   * "30 ரூவா கழி 50 ரூவா வருது" → expense 30 + income 50, margin 20.
   * Returns null when the sentence is not a spend/earn pair.
   */
  function parsePairDeal(text, options) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const menu = (options && options.menu) || defaultMenu();
    const expHits = findWordHits(raw, PAIR_EXPENSE_WORDS);
    const incHits = findWordHits(raw, PAIR_INCOME_WORDS);
    if (!expHits.length || !incHits.length) return null;

    const nums = extractNumbersInOrder(raw);
    if (nums.length < 2) return null;

    const expHit = expHits[0];
    const incHit = incHits[0];
    let spentTok = amountNearestBefore(expHit.start, nums, raw);
    let earnedTok = amountNearestBefore(incHit.start, nums, raw);
    if (!spentTok || !earnedTok || spentTok.start === earnedTok.start) {
      spentTok = nums[0];
      earnedTok = nums[1];
    }
    if (!spentTok || !earnedTok) return null;

    const spent = roundMoney(spentTok.value);
    const earned = roundMoney(earnedTok.value);
    if (spent == null || earned == null || Number.isNaN(spent) || Number.isNaN(earned)) return null;

    let qty = null;
    let unit = "";
    const unitHit = findAlias(UNIT_ALIASES, raw);
    if (unitHit && nums.length >= 3) {
      const others = nums.filter((n) => n.start !== spentTok.start && n.start !== earnedTok.start);
      if (others.length) {
        qty = others[0].value;
        unit = unitHit.row.unit;
      }
    }

    let leftover = raw;
    const holes = expHits.concat(incHits).concat(nums).slice().sort((a, b) => b.start - a.start);
    holes.forEach((h) => {
      leftover = leftover.slice(0, h.start) + " " + leftover.slice(h.end);
    });
    leftover = leftover.replace(/ரூவா|ரூபாய்|ரூபா|ருபாய்|rupees?|ruva|ruwa|ruvaa|rs\.?|inr|₹|\bku\b|\bkku\b|க்கு/gi, " ");
    if (unitHit) leftover = stripPhrase(leftover, unitHit.raw);
    leftover = leftover.replace(/\s+/g, " ").trim();

    const saleHit = leftover ? findAlias(menuAliases(menu), leftover) : null;
    const itemHit = leftover ? findAlias(EXPENSE_ITEMS, leftover) : null;
    let item = "";
    let itemEn = "";
    if (saleHit && (!itemHit || saleHit.len >= itemHit.len)) {
      item = saleHit.row.nameTa;
      itemEn = saleHit.row.nameEn;
    } else if (itemHit) {
      item = itemHit.row.nameTa;
      itemEn = itemHit.row.nameEn;
    }

    const globals = extractGlobals(raw);
    const payMode = globals.payMode || "cash";
    const vehicleNo = globals.vehicleNo || "";
    const margin = roundMoney(earned - spent);

    const expense = attachUncertainty({
      ok: true,
      raw,
      type: "expense",
      item: item || "செலவு",
      itemEn: itemEn || (item ? "" : "Expense"),
      qty: qty,
      unit: unit,
      unitPrice: qty ? roundMoney(spent / qty) : null,
      amount: spent,
      vehicleNo,
      note: "",
      payMode,
      customerName: globals.customerName || "",
      negative: false,
      confidence: "high",
      pairRole: "spent"
    }, { typeHint: "expense", saleHit: false, expHit: itemHit, usedMenuPrice: false, numsLength: nums.length, speechConfidence: options && options.speechConfidence });

    const income = attachUncertainty({
      ok: true,
      raw,
      type: "income",
      item: item || "வரவு",
      itemEn: itemEn || (item ? "" : "Income"),
      qty: qty,
      unit: unit,
      unitPrice: qty ? roundMoney(earned / qty) : null,
      amount: earned,
      vehicleNo: "",
      note: "",
      payMode,
      customerName: globals.customerName || "",
      negative: false,
      confidence: "high",
      pairRole: "earned"
    }, { typeHint: "income", saleHit: saleHit, expHit: false, usedMenuPrice: false, numsLength: nums.length, speechConfidence: options && options.speechConfidence });

    function soften(entry) {
      const ignore = { "unknown-item": 1, "missing-item": 1, "type-unstated": 1 };
      entry.uncertaintyReasons = (entry.uncertaintyReasons || []).filter((r) => !ignore[r]);
      if (entry.uncertain) {
        entry.uncertain.item = false;
        entry.uncertain.type = false;
      }
      entry.needsCheck = entry.uncertaintyReasons.length > 0;
      return entry;
    }
    soften(expense);
    soften(income);

    return {
      ok: true,
      raw,
      paired: true,
      margin,
      entries: [expense, income],
      first: expense,
      needsCheck: expense.needsCheck || income.needsCheck
    };
  }

  /**
   * Parse one or more stall lines from a single spoken/typed sentence.
   * "5 idli 3 tea" → two sale drafts in one result.
   */
  function parseUtterances(text, options) {
    const raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "empty", raw: "", entries: [] };
    const pairDeal = parsePairDeal(raw, options);
    if (pairDeal && pairDeal.ok) return pairDeal;
    const menu = (options && options.menu) || defaultMenu();
    const hits = findAllItemHits(raw, menu);
    const saleOrDistinct = [];
    const seen = new Set();
    for (const h of hits) {
      const key = h.start + ":" + h.end;
      if (seen.has(key)) continue;
      seen.add(key);
      saleOrDistinct.push(h);
    }
    if (saleOrDistinct.length >= 2) {
      const chunks = splitAroundItems(raw, saleOrDistinct);
      const globals = extractGlobals(raw);
      const entries = [];
      for (const ch of chunks) {
        const p = parseUtterance(ch.text, options);
        if (globals.payMode && globals.payMode !== "cash" && (!p.payMode || p.payMode === "cash")) p.payMode = globals.payMode;
        if (globals.customerName && !p.customerName) p.customerName = globals.customerName;
        if (globals.vehicleNo && !p.vehicleNo && p.type === "expense") p.vehicleNo = globals.vehicleNo;
        if (globals.typeHint && !TYPE_EXPENSE_RE.test(ch.text) && !TYPE_INCOME_RE.test(ch.text)) {
          // keep per-chunk type (menu vs expense item) — do not force global type onto food items
        }
        if (p.ok) entries.push(p);
      }
      if (entries.length >= 2) {
        return {
          ok: true,
          raw,
          entries,
          needsCheck: entries.some((e) => e.needsCheck)
        };
      }
    }
    const one = parseUtterance(raw, options);
    return { ok: !!one.ok, raw, entries: one.ok ? [one] : [], first: one, needsCheck: !!(one && one.needsCheck), error: one.ok ? undefined : one.error };
  }

  const VOICE = {
    INITIAL_TIMEOUT_MS: 5500,
    SILENCE_MS: 2000,
    MAX_RESTARTS: 3,
    START_TIMEOUT_MS: 20000
  };

  function shouldRestartRecognition(s) {
    s = s || {};
    return !!(s.listening && s.gotSpeech && !s.stopRequested && (s.restartCount || 0) < VOICE.MAX_RESTARTS);
  }

  function shouldStopForInitialTimeout(s, now) {
    s = s || {};
    return !!(s.listening && !s.gotSpeech && (now - (s.startedAt || 0)) >= VOICE.INITIAL_TIMEOUT_MS);
  }

  function shouldStopForSilence(s, now) {
    s = s || {};
    return !!(s.listening && s.gotSpeech && (now - (s.lastResultAt || 0)) >= VOICE.SILENCE_MS);
  }

  /** v9: one clear bilingual message per SpeechRecognition error code (with steps where the user can fix it). */
  function voiceErrorMessage(code) {
    const allowSteps = {
      ta: "மைக் அனுமதி மறுக்கப்பட்டது. சரிசெய்ய: முகவரிப் பட்டியில் 🔒 (அல்லது ⓘ) தட்டவும் → அனுமதிகள் / Permissions → மைக்ரோஃபோன் → அனுமதி (Allow). அல்லது Chrome ⋮ → Settings → Site settings → Microphone → இந்தத் தளம் → Allow. பிறகு பக்கத்தைப் புதுப்பிக்கவும். அதுவரை தட்டச்சு செய்யுங்கள்.",
      en: "Mic permission denied. To fix: tap the 🔒 (or ⓘ) in the address bar → Permissions → Microphone → Allow. Or Chrome ⋮ → Settings → Site settings → Microphone → this site → Allow. Then reload the page. Until then, please type.",
      hi: "माइक की अनुमति नहीं मिली। ठीक करें: पता-पट्टी में 🔒 (या ⓘ) दबाएँ → Permissions → Microphone → Allow। या Chrome ⋮ → Settings → Site settings → Microphone → यह साइट → Allow। फिर पेज रीलोड करें। तब तक टाइप करें।",
      mr: "माइकची परवानगी नाही. दुरुस्त करा: पत्त्याच्या पट्टीत 🔒 (किंवा ⓘ) दाबा → Permissions → Microphone → Allow. किंवा Chrome ⋮ → Settings → Site settings → Microphone → ही साइट → Allow. मग पेज रीलोड करा. तोपर्यंत टाइप करा."
    };
    const messages = {
      "no-speech": {
        ta: "ஒன்றும் கேட்கவில்லை. போனை வாய்க்கு அருகில் வைத்து மீண்டும் மைக்கைத் தட்டுங்கள், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "Nothing was heard. Hold the phone close, tap the mic again and speak — or type instead.",
        hi: "कुछ सुनाई नहीं दिया। फ़ोन पास रखकर फिर माइक दबाएँ और बोलें — या टाइप कर दीजिए।",
        mr: "काहीच ऐकू आले नाही. फोन जवळ धरून पुन्हा माइक दाबा आणि बोला — किंवा टाइप करा."
      },
      "not-allowed": allowSteps,
      "service-not-allowed": {
        ta: "இந்த போனில் Chrome குரல் சேவை அனுமதிக்கப்படவில்லை. Chrome-ஐ புதுப்பிக்கவும், Google ஆப் (குரல் தேடல்) இயக்கத்தில் உள்ளதா பார்க்கவும். Incognito-வில் வேலை செய்யாது. அதுவரை தட்டச்சு செய்யுங்கள்.",
        en: "Chrome's speech service is not allowed on this phone. Update Chrome and make sure the Google app (voice typing) is enabled; it does not work in Incognito. Please type for now.",
        hi: "इस फ़ोन पर Chrome की आवाज़ सेवा की अनुमति नहीं है। Chrome अपडेट करें और Google ऐप (वॉइस टाइपिंग) चालू रखें; Incognito में नहीं चलता। अभी टाइप करें।",
        mr: "या फोनवर Chrome ची आवाज सेवा चालू नाही. Chrome अपडेट करा आणि Google ॲप (व्हॉइस टायपिंग) चालू ठेवा; Incognito मध्ये चालत नाही. आत्ता टाइप करा."
      },
      "network": {
        ta: "இணையம் இல்லை. குரல் இணையம் வேண்டும் — இணையத்தை இயக்கி மீண்டும் முயலவும், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "No network. Voice needs the internet — turn on data/Wi-Fi and try again, or type instead.",
        hi: "इंटरनेट नहीं है। आवाज़ के लिए इंटरनेट चाहिए — डेटा/Wi-Fi चालू करके फिर कोशिश करें, या टाइप करें।",
        mr: "इंटरनेट नाही. आवाजासाठी इंटरनेट लागते — डेटा/Wi-Fi चालू करून पुन्हा प्रयत्न करा, किंवा टाइप करा."
      },
      "audio-capture": {
        ta: "மைக்கைப் பிடிக்க முடியவில்லை — வேறு ஆப் (அழைப்பு, WhatsApp குரல், ரெக்கார்டர்) மைக்கைப் பயன்படுத்துகிறதா? அதை மூடிவிட்டு மீண்டும் தட்டுங்கள், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "Could not capture audio from the mic — is another app (a call, WhatsApp voice, recorder) using it? Close it and tap again, or type instead.",
        hi: "माइक से आवाज़ नहीं मिली — क्या कोई और ऐप (कॉल, WhatsApp वॉइस, रिकॉर्डर) माइक इस्तेमाल कर रहा है? उसे बंद करके फिर दबाएँ, या टाइप करें।",
        mr: "माइकमधून आवाज मिळाला नाही — दुसरे ॲप (कॉल, WhatsApp व्हॉइस, रेकॉर्डर) माइक वापरत आहे का? ते बंद करून पुन्हा दाबा, किंवा टाइप करा."
      },
      "no-start": {
        ta: "மைக் திறக்கவில்லை. Chrome அனுமதி கேட்டால் 'Allow' அழுத்தவும், பிறகு மீண்டும் மைக்கைத் தட்டுங்கள்.",
        en: "The mic did not open. If Chrome asks for permission, tap 'Allow', then tap the mic again.",
        hi: "माइक नहीं खुला। Chrome अनुमति माँगे तो 'Allow' दबाएँ, फिर माइक दोबारा दबाएँ।",
        mr: "माइक उघडला नाही. Chrome ने परवानगी मागितल्यास 'Allow' दाबा, मग माइक पुन्हा दाबा."
      },
      "language-not-supported": {
        ta: "இந்த மொழிக்கு இந்த போனில் குரல் இல்லை. வேறு மொழியைத் தேர்ந்தெடுக்கவும், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "This phone has no voice support for this language. Pick another voice language, or type instead.",
        hi: "इस फ़ोन में इस भाषा के लिए आवाज़ नहीं है। दूसरी भाषा चुनें, या टाइप करें।",
        mr: "या फोनवर या भाषेसाठी आवाज नाही. दुसरी भाषा निवडा, किंवा टाइप करा."
      },
      "iphone": {
        ta: "iPhone / Safari-ல் குரல் வேலை செய்யாது. தட்டச்சு செய்யுங்கள்.",
        en: "Voice does not work on iPhone/Safari. Please type instead.",
        hi: "iPhone / Safari में आवाज़ काम नहीं करती। टाइप करें।",
        mr: "iPhone / Safari मध्ये आवाज चालत नाही. टाइप करा."
      },
      "unsupported": {
        ta: "இந்த உலாவியில் குரல் இல்லை. Chrome-ல் திறக்கவும், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "Voice is not supported in this browser. Open in Chrome, or please type instead.",
        hi: "इस ब्राउज़र में आवाज़ नहीं है। Chrome में खोलें, या टाइप करें।",
        mr: "या ब्राउझरमध्ये आवाज नाही. Chrome मध्ये उघडा, किंवा टाइप करा."
      },
      "failed": {
        ta: "குரல் பிடிக்கவில்லை. மீண்டும் மைக்கைத் தட்டுங்கள், அல்லது தட்டச்சு செய்யுங்கள்.",
        en: "Voice capture failed. Tap the mic again, or please type instead.",
        hi: "आवाज़ पकड़ में नहीं आई। माइक फिर दबाएँ, या टाइप करें।",
        mr: "आवाज पकडता आला नाही. माइक पुन्हा दाबा, किंवा टाइप करा."
      }
    };
    messages["permission"] = allowSteps;
    return messages[code] || messages.failed;
  }

  /** v9: map a SpeechRecognition onerror code to our message code. "aborted" is our own stop. */
  function voiceErrorCode(err) {
    const e = String(err || "");
    if (e === "aborted") return null;
    if (["no-speech", "not-allowed", "service-not-allowed", "network", "audio-capture", "language-not-supported"].indexOf(e) !== -1) return e;
    return "failed";
  }

  /** v9: the no-speech countdown starts when the mic actually opens (after a first-use permission prompt). */
  function voiceTimeoutCode(s, now) {
    s = s || {};
    if (!s.listening || s.holding) return null;
    if (!s.audioStarted) return (now - (s.tappedAt || 0)) >= VOICE.START_TIMEOUT_MS ? "no-start" : null;
    if (!s.gotSpeech) return (now - (s.startedAt || 0)) >= VOICE.INITIAL_TIMEOUT_MS ? "no-speech" : null;
    return (now - (s.lastResultAt || 0)) >= VOICE.SILENCE_MS ? "done" : null;
  }

  function unsupportedVoiceCode(ua, hasSpeechAPI) {
    if (hasSpeechAPI) return null;
    const u = String(ua || "");
    const ios = /iPhone|iPad|iPod/.test(u);
    if (ios) return "iphone";
    return "unsupported";
  }

  function parsedToEntry(parsed, date) {
    return {
      type: parsed.type,
      date: normalizeDate(date),
      item: parsed.item,
      qty: parsed.qty,
      unit: parsed.unit,
      unitPrice: parsed.unitPrice,
      amount: parsed.amount,
      vehicleNo: parsed.vehicleNo,
      note: parsed.note,
      payMode: parsed.payMode,
      customerName: parsed.customerName,
      category: parsed.category || "",
      calc: parsed.calc || "",
      wageKind: parsed.wageKind || ""
    };
  }

    function validateEntry(input) {
    const errors = [];
    const type = input.type === "income" ? "income" : input.type === "expense" ? "expense" : null;
    if (!type) errors.push("type");
    const amount = roundMoney(Number(input.amount));
    if (input.amount == null || input.amount === "" || Number.isNaN(amount)) {
      errors.push("amount");
    }
    const note = String(input.note || "").trim();
    if (!Number.isNaN(amount) && amount < 0 && !note) {
      errors.push("note-required-for-negative");
    }
    const payMode = normalizePayMode(input.payMode);
    const customerName = String(input.customerName || "").trim();
    if (payMode === "credit" && type === "income" && amount > 0 && !customerName) {
      errors.push("customer-required-for-credit");
    }
    return { ok: errors.length === 0, errors, type, amount, note, payMode, customerName };
  }

  function createLedger(initialEntries) {
    let entries = Array.isArray(initialEntries) ? initialEntries.map((e) => ({ ...e })) : [];

    function snapshot() {
      return entries.map((e) => ({ ...e }));
    }

    function add(input) {
      const v = validateEntry(input);
      if (!v.ok) return { ok: false, errors: v.errors };
      const entry = {
        id: input.id || newId(),
        type: v.type,
        date: normalizeDate(input.date),
        item: String(input.item || "").trim(),
        qty: input.qty == null || input.qty === "" ? null : Number(input.qty),
        unit: String(input.unit || "").trim(),
        unitPrice: input.unitPrice == null || input.unitPrice === "" ? null : Number(input.unitPrice),
        refQty: input.refQty == null || input.refQty === "" ? null : Number(input.refQty),
        refAmount: input.refAmount == null || input.refAmount === "" ? null : Number(input.refAmount),
        amount: v.amount,
        vehicleNo: v.type === "expense" ? String(input.vehicleNo || "").trim() : "",
        note: v.note,
        payMode: v.payMode || "cash",
        customerName: v.customerName || "",
        creditPaid: !!input.creditPaid,
        creditPaidAt: input.creditPaidAt || null,
        createdAt: input.createdAt || new Date().toISOString(),
        updatedAt: input.updatedAt || new Date().toISOString(),
        category: input.category ? String(input.category) : "",
        calc: input.calc ? String(input.calc) : "",
        staffId: input.staffId ? String(input.staffId) : "",
        wageKind: input.wageKind ? String(input.wageKind) : "",
        wageRecordId: input.wageRecordId ? String(input.wageRecordId) : "",
        stockItemId: input.stockItemId ? String(input.stockItemId) : "",
        stockMoveId: input.stockMoveId ? String(input.stockMoveId) : ""
      };
      entries = entries.concat([entry]);
      return { ok: true, entry, entries: snapshot() };
    }

    function edit(id, patch) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return { ok: false, errors: ["not-found"] };
      const merged = { ...entries[idx], ...patch, id };
      const v = validateEntry(merged);
      if (!v.ok) return { ok: false, errors: v.errors };
      const entry = {
        ...merged,
        type: v.type,
        date: normalizeDate(merged.date),
        item: String(merged.item || "").trim(),
        qty: merged.qty == null || merged.qty === "" ? null : Number(merged.qty),
        unit: String(merged.unit || "").trim(),
        unitPrice: merged.unitPrice == null || merged.unitPrice === "" ? null : Number(merged.unitPrice),
        refQty: merged.refQty == null || merged.refQty === "" ? null : Number(merged.refQty),
        refAmount: merged.refAmount == null || merged.refAmount === "" ? null : Number(merged.refAmount),
        amount: v.amount,
        vehicleNo: v.type === "expense" ? String(merged.vehicleNo || "").trim() : "",
        note: v.note,
        payMode: v.payMode || "cash",
        customerName: v.customerName || "",
        creditPaid: !!merged.creditPaid,
        creditPaidAt: merged.creditPaidAt || null,
        updatedAt: new Date().toISOString()
      };
      entries = entries.slice();
      entries[idx] = entry;
      return { ok: true, entry, entries: snapshot() };
    }

    function remove(id) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return { ok: false, errors: ["not-found"] };
      const removed = entries[idx];
      entries = entries.filter((e) => e.id !== id);
      return { ok: true, removed, entries: snapshot() };
    }

    function totalsForDate(date) {
      return computeTotals(entries, date);
    }

    function listForDate(date) {
      const d = normalizeDate(date);
      return entries.filter((e) => e.date === d);
    }

    return {
      add,
      edit,
      remove,
      totalsForDate,
      listForDate,
      all: snapshot,
      replace(next) {
        entries = Array.isArray(next) ? next.map((e) => ({ ...e })) : [];
      }
    };
  }

  /**
   * Daily totals are always recomputed from the full entry list.
   * Never incrementally add/subtract — that is what broke earlier versions.
   * வரவு = sum(income amounts), செலவு = sum(expense amounts), லாபம் = வரவு - செலவு.
   * Negative adjustments (with a required note) reduce the corresponding side.
   */
  function computeTotals(entries, date) {
    const d = date ? normalizeDate(date) : null;
    let income = 0;
    let expense = 0;
    const list = Array.isArray(entries) ? entries : [];
    for (const e of list) {
      if (!e || e.deleted) continue;
      if (d && e.date !== d) continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt)) continue;
      if (e.type === "income") income += amt;
      else if (e.type === "expense") expense += amt;
    }
    income = roundMoney(income);
    expense = roundMoney(expense);
    return {
      income,
      expense,
      profit: roundMoney(income - expense),
      வரவு: income,
      செலவு: expense,
      லாபம்: roundMoney(income - expense)
    };
  }


  function roundQty(n) {
    return Math.round(Number(n) * 1000) / 1000;
  }

  const DEFAULT_COST_BY_ID = { idli: 3.5, dosa: 12, vada: 5, pongal: 12, tea: 4, coffee: 6 };

  function defaultCostPrice(id) {
    const key = String(id || "");
    return DEFAULT_COST_BY_ID[key] != null ? DEFAULT_COST_BY_ID[key] : null;
  }

  function normalizeMenu(menu) {
    const base = defaultMenu();
    if (!Array.isArray(menu) || !menu.length) return base.map((m) => ({ ...m }));
    return menu.map((m, i) => {
      const id = String(m.id || "item-" + i);
      let cost = m.costPrice;
      if (cost == null || cost === "") cost = defaultCostPrice(id);
      else cost = Number(cost);
      if (Number.isNaN(cost)) cost = defaultCostPrice(id);
      return {
        id,
        nameTa: String(m.nameTa || m.name || ""),
        nameEn: String(m.nameEn || ""),
        price: Number(m.price) || 0,
        unit: m.unit || "எண்ணிக்கை",
        costPrice: cost
      };
    }).filter((m) => m.nameTa || m.nameEn);
  }

  function defaultStockItems() {
    return [
      { id: "maavu", nameTa: "மாவு", nameEn: "Batter / Flour", qty: 0, unit: "கிலோ", minAlert: 8 },
      { id: "paal", nameTa: "பால்", nameEn: "Milk", qty: 0, unit: "லிட்டர்", minAlert: 4 },
      { id: "gas", nameTa: "வாயு சிலிண்டர்", nameEn: "Gas / LPG", qty: 0, unit: "எண்ணிக்கை", minAlert: 1 },
      { id: "sugar", nameTa: "சக்கரை", nameEn: "Sugar", qty: 0, unit: "கிலோ", minAlert: 2 },
      { id: "teapowder", nameTa: "டீ தூள்", nameEn: "Tea powder", qty: 0, unit: "கிலோ", minAlert: 1 },
      { id: "oil", nameTa: "எண்ணெய்", nameEn: "Oil", qty: 0, unit: "லிட்டர்", minAlert: 2 }
    ];
  }

  function normalizeStockItem(s, i) {
    s = s || {};
    return {
      id: String(s.id || "stock-" + i),
      nameTa: String(s.nameTa || s.name || ""),
      nameEn: String(s.nameEn || ""),
      qty: s.qty == null || s.qty === "" || Number.isNaN(Number(s.qty)) ? 0 : Number(s.qty),
      unit: String(s.unit || "கிலோ"),
      minAlert: s.minAlert == null || s.minAlert === "" || Number.isNaN(Number(s.minAlert)) ? 0 : Number(s.minAlert)
    };
  }

  function normalizeStockList(list) {
    if (!Array.isArray(list) || !list.length) return defaultStockItems();
    return list.map(normalizeStockItem).filter((s) => s.nameTa || s.nameEn);
  }

  function stockIsUninitialized(stock, moves) {
    const noMoves = !Array.isArray(moves) || moves.length === 0;
    const allZero = (stock || []).every((s) => Number(s.qty) === 0);
    return noMoves && allZero;
  }

  function lowStockItems(stock, moves) {
    const items = stock || [];
    return items.filter((s) => {
      const tracked = Number(s.qty) !== 0 || (moves || []).some((m) => m.itemId === s.id);
      return tracked && Number(s.qty) <= Number(s.minAlert || 0);
    });
  }

  function upsertStockItem(stock, input) {
    const items = (stock || []).map((s) => ({ ...s }));
    const next = normalizeStockItem({
      id: input && input.id,
      nameTa: input && (input.nameTa || input.name),
      nameEn: input && input.nameEn,
      qty: input && input.qty,
      unit: input && input.unit,
      minAlert: input && input.minAlert
    }, items.length);
    if (!next.nameTa && !next.nameEn) return { ok: false, errors: ["name"] };
    const idx = items.findIndex((s) => s.id === next.id);
    if (idx === -1) {
      if (!next.id || next.id === "stock-" + items.length) next.id = newId();
      items.push(next);
    } else {
      next.qty = input && input.qty != null && input.qty !== "" ? next.qty : items[idx].qty;
      items[idx] = { ...items[idx], ...next, id: items[idx].id };
    }
    return { ok: true, stock: items, item: idx === -1 ? items[items.length - 1] : items[idx] };
  }

  function addStock(stock, moves, input) {
    input = input || {};
    const qty = Number(input.qty);
    if (!(qty > 0) || Number.isNaN(qty)) return { ok: false, errors: ["qty"] };
    const items = (stock || []).map((s) => ({ ...s }));
    const idx = items.findIndex((s) => s.id === input.itemId);
    if (idx === -1) return { ok: false, errors: ["not-found"] };
    items[idx] = { ...items[idx], qty: roundQty(Number(items[idx].qty) + qty) };
    const amount = input.amount == null || input.amount === "" ? null : Number(input.amount);
    const unitPrice = input.unitPrice == null || input.unitPrice === ""
      ? (amount != null && qty ? roundMoney(amount / qty) : null)
      : Number(input.unitPrice);
    const move = {
      id: input.moveId || newId(),
      type: "in",
      itemId: items[idx].id,
      qty,
      date: normalizeDate(input.date),
      note: String(input.note || "").trim(),
      amount: amount != null && !Number.isNaN(amount) ? roundMoney(amount) : null,
      createdAt: new Date().toISOString()
    };
    const stockMoves = (moves || []).concat([move]);
    let expense = null;
    const logExpense = input.logExpense === true || (input.logExpense !== false && amount != null && amount > 0 && input.logExpense !== 0);
    // Only log when explicitly requested, or when amount given and logExpense not false
    const shouldLog = input.logExpense === true || (input.logExpense !== false && amount != null && amount > 0);
    if (input.logExpense === false) {
      // never
    } else if (shouldLog && amount != null && amount > 0) {
      expense = {
        id: input.entryId || newId(),
        type: "expense",
        date: move.date,
        item: items[idx].nameTa || items[idx].nameEn,
        qty,
        unit: items[idx].unit,
        unitPrice,
        amount: roundMoney(amount),
        payMode: "cash",
        note: move.note || "இருப்பு வாங்குதல் / Stock purchase",
        category: "stock",
        stockItemId: items[idx].id,
        stockMoveId: move.id
      };
    }
    return { ok: true, stock: items, stockMoves, move, expense, item: items[idx] };
  }

  function useStock(stock, moves, input) {
    input = input || {};
    const qty = Number(input.qty);
    if (!(qty > 0) || Number.isNaN(qty)) return { ok: false, errors: ["qty"] };
    const items = (stock || []).map((s) => ({ ...s }));
    const idx = items.findIndex((s) => s.id === input.itemId);
    if (idx === -1) return { ok: false, errors: ["not-found"] };
    if (Number(items[idx].qty) < qty) {
      return { ok: false, errors: ["insufficient-stock"], item: items[idx], available: Number(items[idx].qty) };
    }
    items[idx] = { ...items[idx], qty: roundQty(Number(items[idx].qty) - qty) };
    const move = {
      id: input.moveId || newId(),
      type: "out",
      itemId: items[idx].id,
      qty,
      date: normalizeDate(input.date),
      note: String(input.note || "").trim(),
      createdAt: new Date().toISOString()
    };
    return { ok: true, stock: items, stockMoves: (moves || []).concat([move]), move, item: items[idx] };
  }

  function itemMargins(menu) {
    return (menu || []).map((m) => {
      const price = Number(m.price) || 0;
      const cost = m.costPrice == null || m.costPrice === "" || Number.isNaN(Number(m.costPrice))
        ? null
        : Number(m.costPrice);
      const unitProfit = cost == null ? null : roundMoney(price - cost);
      const marginPct = cost == null || !price ? null : roundMoney((unitProfit / price) * 100);
      return {
        id: m.id,
        nameTa: m.nameTa,
        nameEn: m.nameEn,
        price,
        costPrice: cost,
        unit: m.unit,
        unitProfit,
        marginPct,
        costMissing: cost == null
      };
    });
  }

  function matchMenuItem(entry, menu) {
    const item = String((entry && entry.item) || "").trim().toLowerCase();
    if (!item) return null;
    const list = menu || [];
    return list.find((m) =>
      String(m.id || "").toLowerCase() === item ||
      String(m.nameTa || "").toLowerCase() === item ||
      String(m.nameEn || "").toLowerCase() === item
    ) || null;
  }

  function dayItemProfits(entries, date, menu) {
    const d = normalizeDate(date);
    const rows = itemMargins(menu).map((m) => ({
      ...m,
      qtySold: 0,
      revenue: 0,
      costTotal: 0,
      profitTotal: null
    }));
    const byId = {};
    rows.forEach((r) => { byId[r.id] = r; });
    let unmatchedRevenue = 0;
    for (const e of entries || []) {
      if (!e || e.deleted || e.type !== "income" || e.date !== d) continue;
      const amt = Number(e.amount);
      if (Number.isNaN(amt) || amt < 0) continue;
      const hit = matchMenuItem(e, menu);
      const qty = e.qty == null || e.qty === "" || Number.isNaN(Number(e.qty)) ? 1 : Number(e.qty);
      if (!hit || !byId[hit.id]) {
        unmatchedRevenue = roundMoney(unmatchedRevenue + amt);
        continue;
      }
      const row = byId[hit.id];
      row.qtySold = roundQty(row.qtySold + qty);
      row.revenue = roundMoney(row.revenue + amt);
      if (row.costPrice != null) {
        row.costTotal = roundMoney(row.costTotal + qty * row.costPrice);
        row.profitTotal = roundMoney(row.revenue - row.costTotal);
      }
    }
    const withSales = rows.filter((r) => r.qtySold);
    const priced = rows.filter((r) => r.profitTotal != null);
    return {
      rows,
      withSales,
      totalRevenue: roundMoney(rows.reduce((s, r) => s + r.revenue, 0)),
      totalCost: roundMoney(priced.reduce((s, r) => s + r.costTotal, 0)),
      totalProfit: roundMoney(priced.reduce((s, r) => s + r.profitTotal, 0)),
      unmatchedRevenue
    };
  }

  function normalizeStaffMember(s, i) {
    s = s || {};
    return {
      id: String(s.id || "staff-" + i),
      name: String(s.name || s.nameTa || "").trim(),
      dailyWage: s.dailyWage == null || s.dailyWage === "" || Number.isNaN(Number(s.dailyWage)) ? 0 : Number(s.dailyWage),
      weeklyWage: s.weeklyWage == null || s.weeklyWage === "" || Number.isNaN(Number(s.weeklyWage)) ? 0 : Number(s.weeklyWage)
    };
  }

  function normalizeStaffList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeStaffMember).filter((s) => s.name);
  }

  function addStaff(staff, input) {
    const member = normalizeStaffMember({
      id: (input && input.id) || newId(),
      name: input && input.name,
      dailyWage: input && input.dailyWage,
      weeklyWage: input && input.weeklyWage
    }, (staff || []).length);
    if (!member.name) return { ok: false, errors: ["name"] };
    return { ok: true, staff: (staff || []).concat([member]), member };
  }

  function editStaff(staff, id, patch) {
    const items = (staff || []).map((s) => ({ ...s }));
    const idx = items.findIndex((s) => s.id === id);
    if (idx === -1) return { ok: false, errors: ["not-found"] };
    const merged = normalizeStaffMember({ ...items[idx], ...(patch || {}), id }, idx);
    if (!merged.name) return { ok: false, errors: ["name"] };
    items[idx] = merged;
    return { ok: true, staff: items, member: merged };
  }

  function staffBalance(staffId, wages) {
    let unpaidWages = 0;
    let wagesPaid = 0;
    let advances = 0;
    for (const w of wages || []) {
      if (!w || w.staffId !== staffId) continue;
      const amt = Number(w.amount) || 0;
      if (w.kind === "advance") advances += amt;
      else if (w.kind === "daily" || w.kind === "weekly") {
        if (w.paid) wagesPaid += amt;
        else unpaidWages += amt;
      }
    }
    return {
      unpaidWages: roundMoney(unpaidWages),
      wagesPaid: roundMoney(wagesPaid),
      advances: roundMoney(advances),
      balanceOwed: roundMoney(unpaidWages - advances)
    };
  }

  function staffSummaries(staff, wages) {
    return (staff || []).map((s) => Object.assign({}, s, staffBalance(s.id, wages)));
  }

  function wageExpenseDraft(rec, member) {
    const isAdv = rec.kind === "advance";
    const label = isAdv ? "முன்பணம்" : "கூலி";
    return {
      id: rec.entryId,
      type: "expense",
      date: rec.date,
      item: label + ": " + member.name,
      qty: 1,
      unit: rec.kind === "weekly" ? "வாரம்" : "நாள்",
      amount: rec.amount,
      payMode: "cash",
      note: rec.note || (isAdv ? "முன்பணம் / Advance" : (rec.kind === "weekly" ? "வாரக் கூலி / Weekly wage" : "தினக்கூலி / Daily wage")),
      category: "wage",
      staffId: rec.staffId,
      wageKind: rec.kind,
      wageRecordId: rec.id
    };
  }

  function recordWage(wages, staff, input) {
    input = input || {};
    const member = (staff || []).find((s) => s.id === input.staffId);
    if (!member) return { ok: false, errors: ["not-found"] };
    const kind = input.kind === "weekly" ? "weekly" : input.kind === "advance" ? "advance" : "daily";
    let amount;
    if (input.amount != null && input.amount !== "") amount = Number(input.amount);
    else if (kind === "weekly") amount = Number(member.weeklyWage);
    else if (kind === "daily") amount = Number(member.dailyWage);
    if (!(amount > 0) || Number.isNaN(amount)) return { ok: false, errors: ["amount"] };
    const paid = kind === "advance" ? true : input.paid !== false;
    const rec = {
      id: input.id || newId(),
      staffId: member.id,
      date: normalizeDate(input.date),
      kind,
      amount: roundMoney(amount),
      paid,
      note: String(input.note || "").trim(),
      entryId: paid ? (input.entryId || newId()) : null,
      createdAt: new Date().toISOString()
    };
    const expense = paid ? wageExpenseDraft(rec, member) : null;
    return { ok: true, wages: (wages || []).concat([rec]), record: rec, expense, member };
  }

  function payWageRecord(wages, staff, recordId) {
    const list = (wages || []).map((w) => ({ ...w }));
    const idx = list.findIndex((w) => w.id === recordId);
    if (idx === -1) return { ok: false, errors: ["not-found"] };
    if (list[idx].paid) return { ok: false, errors: ["already-paid"] };
    const member = (staff || []).find((s) => s.id === list[idx].staffId);
    if (!member) return { ok: false, errors: ["not-found"] };
    list[idx].paid = true;
    list[idx].entryId = newId();
    return { ok: true, wages: list, record: list[idx], expense: wageExpenseDraft(list[idx], member), member };
  }

  function removeWageRecord(wages, recordId) {
    const list = wages || [];
    const rec = list.find((w) => w.id === recordId);
    if (!rec) return { ok: false, errors: ["not-found"] };
    return { ok: true, wages: list.filter((w) => w.id !== recordId), record: rec };
  }

  /**
   * Load stock/staff from settings (preferred) or from the Phase 2 file's
   * standalone keys, if a user already tried that page on this phone.
   */
  function loadShopExtras(parsedSettings, legacy) {
    const s = parsedSettings || {};
    const lg = legacy || {};
    const stockSrc = Array.isArray(s.stock) && s.stock.length ? s.stock : lg.stockV2;
    const staffSrc = Array.isArray(s.staff) ? s.staff : lg.staffV2;
    return {
      stock: normalizeStockList(stockSrc),
      staff: normalizeStaffList(staffSrc),
      wages: Array.isArray(s.wages) ? s.wages.map((w) => ({ ...w })) : [],
      stockMoves: Array.isArray(s.stockMoves) ? s.stockMoves.map((m) => ({ ...m })) : []
    };
  }


  /* =====================================================================
   * v7: one-shot commands — speak or type once, save directly (no confirm).
   * parseCommand() understands Tamil, English, Hindi and Marathi (script or
   * romanized, mixed in one sentence), several entries in one sentence, a
   * person's name ("ரவி பேருக்கு", "Ravi ke naam", "रवीच्या नावावर"), and
   * add / minus verbs ("போடு", "kazhi", "daalo", "वजा" …).
   * ===================================================================== */

  const CMD_INCOME_WORDS = [
    // Tamil (prefix match on a word)
    "போட", "போடு", "சேர்", "கூட்டு", "கூட்டி", "வரவு", "வந்தது", "வந்துச்சு", "வந்திருக்கு", "வருது", "வருகிறது",
    "கிடைச்சது", "கிடைத்தது", "வித்தேன்", "வித்தது", "விற்றேன்", "விற்றது", "பிளஸ்",
    // Tanglish
    "podu", "poadu", "pottu", "podunga", "podungo", "podanum", "podu.", "ser", "serthu", "serththu", "serthuko", "kootu", "koottu", "kootti",
    "varavu", "vandhadhu", "vanthathu", "vandhuchu", "vanthuchu", "varudhu", "varuthu", "kidaichadhu", "kidaichathu", "vithadhu", "viththen", "vithen",
    // English
    "add", "plus", "income", "received", "receive", "got", "sold", "earned", "credit to",
    // Hindi
    "jama", "jodo", "jod", "daalo", "dalo", "daal do", "dal do", "aaya", "aya", "aayi", "aaye", "aae", "mila", "mili", "mile", "becha", "bika", "bikri",
    "जमा", "जोडो", "जोड", "डालो", "डाल दो", "डाल", "आया", "आई", "आए", "आये", "मिला", "मिली", "मिले", "बेचा", "बिका", "बिक्री",
    // Marathi
    "टाका", "टाक", "आले", "आली", "आला", "मिळाले", "मिळाला", "विकले", "विक्री", "taka", "taak", "aale", "aala", "milale", "vikle", "vikri"
  ];
  const CMD_EXPENSE_WORDS = [
    // Tamil
    "கழி", "செலவு", "செலவாச்சு", "போச்சு", "போனது", "போயிடுச்சு", "போய்விட்டது", "மைனஸ்", "கட்டினேன்", "கட்டியது",
    "வாங்கினேன்", "வாங்குனேன்", "வாங்கியது", "வாங்கினது", "வாங்குனது",
    // Tanglish
    "kazhi", "kazhichu", "kazhikka", "kazhichidu", "kazhichudu", "kazhichen", "kalichu", "kazichu", "kazhi.",
    "selavu", "chelavu", "selavaachu", "pochu", "pochchu", "ponadhu", "ponathu", "poyiduchu", "poyichu",
    "kattinen", "vaanginen", "vaangunen", "vaangitten", "vaangunadhu", "vaangunaathu",
    // English
    "minus", "expense", "spent", "spend", "subtract", "deduct", "bought",
    // Hindi
    "kharcha", "kharch", "kharche", "ghatao", "ghata do", "ghatado", "gaya", "gaye", "gayi", "diya", "diye", "kam karo", "kam kar do", "bhara", "chukaya", "kharida", "khareeda",
    "खर्चा", "खर्च", "खर्चे", "घटाओ", "घटा दो", "गया", "गए", "गये", "गई", "दिया", "दिए", "दिये", "कम करो", "कम कर दो", "भरा", "चुकाया", "खरीदा",
    // Marathi
    "वजा", "वजा करा", "गेले", "गेला", "गेली", "दिले", "दिला", "दिली", "भरले", "घेतले", "खरेदी",
    "vaja", "gele", "gela", "dile", "dila", "bharle", "ghetle", "kharedi"
  ];
  // Words that mean the amount was a discount / refund (old "minus adjustment" path).
  const CMD_ADJ_RE = /(?:discount|தள்ளுபடி|கழிவு|சரிகட்டு|refund|திருப்பம்|negative|adjustment|छूट|छुट|सूट|डिस्काउंट|chhoot|chhut)/i;
  // Credit: "kadan", "udhaar", "baaki" — or "write it in X's name" (likh do / எழுது).
  const CMD_CREDIT_RE = /(?:\bcredit\b|கடன்|கடனா|kadan|udhari|udhaar|udhar|उधार|उधारी|उसने|पाक्की|பாக்கி|baaki|baki|बाकी|\blater\b|likh do|likh lo|likho|लिख दो|लिख लो|लिखो|लिहा|लिहून ठेवा|எழுது|எழுதிக்கோ|எழுதிடு|ezhuthu|ezhudhu|ezhuthiko|ezhudhiko|khate me|khaate me|खाते में|खात्यावर|khatyavar)/i;
  const CMD_UPI_RE = /(?:\bupi\b|யூபிஐ|यूपीआई|gpay|g pay|phonepe|phone pe|फोनपे|फ़ोनपे|paytm|पेटीएम|google\s*pay|गूगल पे|\bonline\b|ऑनलाइन|ஆன்லைன்)/i;
  const CMD_CASH_RE = /(?:\bcash\b|கேஷ்|ரொக்கம்|नकद|नगद|कैश|रोख|\bnakad\b|\brokh\b)/i;
  const CMD_CURRENCY_AFTER_RE = /^\s*(?:ரூவா|ரூபாய்|ரூபா|ருபாய்|ரூ\.?|rupees?|rupaye|rupaiye|rupay|rupiya|rupya|ruva|ruwa|ruvaa|rs\.?|inr|₹|रुपये|रुपए|रुपया|रुपय|रूपये|रूपए|रु\.?|पैसे|paise|bucks)(?![A-Za-z])/i;
  const CMD_CURRENCY_BEFORE_RE = /(?:₹|(?:^|[^A-Za-z])rs\.?|(?:^|[^A-Za-z])inr|रु\.?|ரூ\.?)\s*$/i;

  // Strong "in X's name" markers. Names come right before them.
  const NAME_MARKERS = [
    // Tamil / Tanglish
    "பேருக்கு", "பேர்ல", "பேர்லே", "பேரில்", "பேருல", "பேர்க்கு", "பெயருக்கு", "பெயரில்", "பெயர்ல", "கணக்குல", "கணக்கில்", "கணக்குக்கு",
    "peruku", "perukku", "perla", "perle", "perula", "peril", "peyaruku", "peyarukku", "peyaril", "kanakula", "kanakkula", "kanakkil", "kanakkuku",
    // Hindi
    "के नाम पर", "के नाम पे", "के नाम से", "के नाम", "के खाते में", "के खाते", "का खाता",
    "ke naam par", "ke naam pe", "ke naam se", "ke naam", "ke nam par", "ke nam", "ke khate me", "ke khate mein", "ke khate", "ka khata", "ke account",
    // Marathi (name usually carries च्या: "रवीच्या नावावर")
    "च्या नावावर", "च्या नावाने", "च्या नावे", "च्या खात्यावर", "च्या खात्यात", "नावावर", "नावाने", "खात्यावर", "खात्यात",
    "chya navavar", "chya naavavar", "chya navane", "chya khatyavar", "navavar", "naavavar", "navane", "khatyavar",
    // English
    "'s name", "'s account", "s name", "name", "account", "a/c"
  ];
  const WEAK_NAME_MARKERS = ["ka", "ki", "ke", "ko", "का", "की", "के", "को"];
  const MARATHI_POSSESSIVE_RE = /(च्या|चे|चा|ची)$/;
  const SEPARATOR_WORDS = [
    "and", "um", "உம்", "அப்புறம்", "அப்றம்", "அப்பறம்", "அப்புறமா", "அடுத்து", "மேலும்", "appuram", "apram", "approm", "aprom", "aduthu",
    "then", "also", "next", "aur", "और", "ani", "aani", "आणि", "व", "phir", "fir", "फिर", "मग", "mag", "तसेच"
  ];
  const LEFTOVER_STOP = new Set([
    "ka", "ki", "ke", "ko", "ne", "se", "me", "mein", "main", "hai", "he", "tha", "liye", "wala", "wali", "paise", "paisa", "rupaye", "rupees", "rupee", "rs", "inr",
    "aaj", "kal", "abhi", "bhai", "bhaiya", "ji", "sir", "please", "plz", "ok", "okay", "haan", "ha", "to", "for", "of", "a", "an", "the", "and", "in", "on", "at", "is", "was",
    "it", "this", "that", "today", "now", "total", "only", "ku", "kku", "ah", "la", "le", "inniki", "innikku", "ippo", "naa", "nga", "anna", "akka", "sari", "seri",
    "chya", "cha", "chi", "che", "sathi", "zale", "kela", "kele", "karo", "kar", "do", "de", "dena", "bhi", "ye", "yeh", "wo", "vo", "rupay", "ruva", "ruvaa", "ruwa", "rupiya",
    "pls", "aa", "o", "ae", "ennaku", "enakku", "unakku", "please.", "with",
    "க்கு", "கு", "இன்னிக்கு", "இன்று", "இப்போ", "இப்ப", "சரி", "அண்ணா", "அண்ணே", "அக்கா", "மொத்தம்", "ஆ", "தான்", "இந்த", "அந்த", "ரூவா", "ரூபாய்", "ரூபா", "ருபாய்", "ஓகே", "சார்",
    "का", "की", "के", "को", "ने", "से", "में", "है", "हैं", "था", "थे", "लिए", "वाला", "वाली", "पैसे", "पैसा", "रुपये", "रुपए", "रुपया", "रूपये", "आज", "कल", "अभी", "भाई", "भैया", "जी",
    "हां", "हा", "यह", "ये", "वो", "कुल", "सिर्फ", "करो", "कर", "दे", "दो", "देना", "भी",
    "चा", "ची", "चे", "च्या", "ला", "मध्ये", "साठी", "काल", "आता", "भाऊ", "झाले", "केले", "करा", "एकूण", "फक्त"
  ]);
  const NAME_BLOCK = new Set([
    "dukan", "dukaan", "दुकान", "ghar", "घर", "shop", "kadai", "கடை", "gaadi", "गाडी", "bijli", "बिजली", "light", "bill", "बिल", "maal", "माल",
    "saman", "सामान", "staff", "pagar", "पगार", "salary", "sambalam", "சம்பளம்", "கரண்ட்", "current", "my", "his", "her", "our", "customer", "aadmi", "आदमी",
    "cash", "upi", "kadan", "credit", "udhaar", "baaki", "online"
  ]);
  const INDIAN_STATE_CODES = /^(?:AN|AP|AR|AS|BR|CG|CH|DD|DL|DN|GA|GJ|HP|HR|JH|JK|KA|KL|LA|LD|MH|ML|MN|MP|MZ|NL|OD|OR|PB|PY|RJ|SK|TN|TR|TS|UK|UP|WB)$/i;
  const CMD_VEHICLE_KEY_RE = /(?:vandi|vaandi|vehicle|vaahanam|gaadi|gadi|गाडी|गाड़ी|वाहन|வண்டி|வாகன(?:ம்)?(?:\s*எண்)?)\s*(?:no\.?|number|नंबर|எண்)?\s*[:\-]?\s*([A-Za-z]{2}\s*-?\s*\d{1,2}\s*-?\s*[A-Za-z]{1,3}\s*-?\s*\d{1,4})/i;
  const CMD_VEHICLE_BARE_RE = /(^|[^A-Za-z0-9])([A-Za-z]{2})(\s*-?\s*)(\d{1,2})(\s*-?\s*)([A-Za-z]{1,3})(\s*-?\s*)(\d{1,4})(?![A-Za-z0-9])/;

  const ITEM_NAMES = {
    "இட்லி": { en: "Idli", hi: "इडली", mr: "इडली" },
    "தோசை": { en: "Dosa", hi: "डोसा", mr: "डोसा" },
    "மசாலா தோசை": { en: "Masala dosa", hi: "मसाला डोसा", mr: "मसाला डोसा" },
    "வடை": { en: "Vada", hi: "वडा", mr: "वडा" },
    "பொங்கல்": { en: "Pongal", hi: "पोंगल", mr: "पोंगल" },
    "டீ": { en: "Tea", hi: "चाय", mr: "चहा" },
    "காபி": { en: "Coffee", hi: "कॉफी", mr: "कॉफी" },
    "தக்காளி": { en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" },
    "வெங்காயம்": { en: "Onion", hi: "प्याज", mr: "कांदा" },
    "மாவு": { en: "Batter / flour", hi: "आटा / घोल", mr: "पीठ" },
    "டீசல்": { en: "Diesel", hi: "डीजल", mr: "डिझेल" },
    "பெட்ரோல்": { en: "Petrol", hi: "पेट्रोल", mr: "पेट्रोल" },
    "வாயு சிலிண்டர்": { en: "Gas cylinder", hi: "गैस सिलेंडर", mr: "गॅस सिलेंडर" },
    "அரிசி": { en: "Rice", hi: "चावल", mr: "तांदूळ" },
    "உளுந்து": { en: "Urad dal", hi: "उड़द दाल", mr: "उडीद डाळ" },
    "எண்ணெய்": { en: "Oil", hi: "तेल", mr: "तेल" },
    "சீனி": { en: "Sugar", hi: "चीनी", mr: "साखर" },
    "சக்கரை": { en: "Sugar", hi: "चीनी", mr: "साखर" },
    "காய்கறி": { en: "Vegetables", hi: "सब्जी", mr: "भाजी" },
    "பால்": { en: "Milk", hi: "दूध", mr: "दूध" },
    "வாடகை": { en: "Rent", hi: "किराया", mr: "भाडे" },
    "தண்ணீர்": { en: "Water", hi: "पानी", mr: "पाणी" },
    "டீ தூள்": { en: "Tea powder", hi: "चाय पत्ती", mr: "चहा पावडर" },
    "காபி தூள்": { en: "Coffee powder", hi: "कॉफी पाउडर", mr: "कॉफी पावडर" },
    "உருளைக்கிழங்கு": { en: "Potato", hi: "आलू", mr: "बटाटा" },
    "மிளகாய்": { en: "Chilli", hi: "मिर्च", mr: "मिरची" },
    "தேங்காய்": { en: "Coconut", hi: "नारियल", mr: "नारळ" },
    "முட்டை": { en: "Eggs", hi: "अंडे", mr: "अंडी" },
    "கொத்தமல்லி": { en: "Coriander", hi: "धनिया", mr: "कोथिंबीर" },
    "கொடுத்தது": { en: "Paid to", hi: "दिया", mr: "दिले" },
    "பெற்றது": { en: "Received from", hi: "मिला", mr: "मिळाले" },
    "gas": { en: "Gas", hi: "गैस", mr: "गॅस" },
    "வரவு": { en: "Income", hi: "आमदनी", mr: "जमा" },
    "செலவு": { en: "Expense", hi: "खर्च", mr: "खर्च" },
    "சரிகட்டு": { en: "Adjustment", hi: "समायोजन", mr: "समायोजन" },
    "பிற": { en: "Other", hi: "अन्य", mr: "इतर" },
    "கூலி": { en: "Wages", hi: "मजदूरी", mr: "पगार" },
    "முன்பணம்": { en: "Advance", hi: "एडवांस", mr: "आगाऊ" }
  };

  /** Show a stored Tamil item name in the chosen language (unknown names pass through). */
  function itemLabel(item, lang) {
    const raw = String(item || "");
    if (!lang || lang === "ta") return raw;
    const row = ITEM_NAMES[raw.trim()];
    if (row) return row[lang] || row.en || raw;
    // A wage entry: "கூலி — Murugan"
    const m = raw.match(/^(கூலி|முன்பணம்)(\s*[—:-]\s*.*)$/);
    if (m && ITEM_NAMES[m[1]]) return (ITEM_NAMES[m[1]][lang] || ITEM_NAMES[m[1]].en) + m[2];
    return raw;
  }

  const UNIT_NAMES = {
    "கிலோ": { en: "kg", hi: "किलो", mr: "किलो" },
    "கிராம்": { en: "gram", hi: "ग्राम", mr: "ग्रॅम" },
    "லிட்டர்": { en: "litre", hi: "लीटर", mr: "लिटर" },
    "கிளாஸ்": { en: "glass", hi: "गिलास", mr: "ग्लास" },
    "பொட்டலம்": { en: "packet", hi: "पैकेट", mr: "पाकीट" },
    "எண்ணிக்கை": { en: "pcs", hi: "नग", mr: "नग" },
    "மூட்டை": { en: "bag", hi: "बोरी", mr: "पोते" },
    "சிலிண்டர்": { en: "cylinder", hi: "सिलेंडर", mr: "सिलेंडर" },
    "பிளேட்": { en: "plate", hi: "प्लेट", mr: "प्लेट" },
    "டஜன்": { en: "dozen", hi: "दर्जन", mr: "डझन" }
  };
  /** Stored Tamil unit → label in the chosen language. */
  function unitLabel(unit, lang) {
    const raw = String(unit || "");
    if (!lang || lang === "ta") return raw;
    const row = UNIT_NAMES[raw.trim()];
    return row ? row[lang] || row.en : raw;
  }

  function normalizeCommandText(raw) {
    let s = normalizeDeva(normalizeDigits(String(raw || "")));
    s = s.replace(/[।॥]/g, ", ").replace(/[\u200B-\u200D\uFEFF]/g, "");
    s = s.replace(/[“”"]/g, " ").replace(/\s+/g, " ").trim();
    return s;
  }

  function cmdWords(text) {
    const out = [];
    const re = /[^\s,;!?:]+/g;
    let m;
    while ((m = re.exec(text))) {
      let w = m[0];
      let start = m.index;
      // trailing full stop is punctuation ("podu." / "500.")
      while (w.length > 1 && /[.]$/.test(w) && !/\d\.$/.test(w.slice(-2) + "")) { w = w.slice(0, -1); }
      if (/^\d+\.$/.test(w)) w = w.slice(0, -1);
      out.push({ t: w, low: w.toLowerCase(), start, end: start + w.length });
    }
    return out;
  }

  function isLatinWord(w) { return /^[A-Za-z'./]+$/.test(w); }

  // Match a phrase (one or more words) at word index i. Latin = exact (case-insensitive);
  // Tamil/Devanagari single words may be a prefix ("கழிக்க" starts with "கழி").
  function phraseAt(words, i, phrase, allowPrefix) {
    const parts = phrase.toLowerCase().split(" ");
    if (i + parts.length > words.length) return 0;
    for (let k = 0; k < parts.length; k++) {
      const w = words[i + k].low;
      const p = parts[k];
      const last = k === parts.length - 1;
      if (w === p) continue;
      if (allowPrefix && last && !isLatinWord(p) && w.startsWith(p)) continue;
      return 0;
    }
    return parts.length;
  }

  function findPhraseHits(words, list, kind, allowPrefix) {
    const sorted = list.slice().sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length);
    const hits = [];
    const used = new Array(words.length).fill(false);
    for (let i = 0; i < words.length; i++) {
      if (used[i]) continue;
      for (const p of sorted) {
        const n = phraseAt(words, i, p, allowPrefix);
        if (!n) continue;
        if (kind === "expense" && /^கழிவு/.test(words[i].t)) continue; // கழிவு = discount, not "minus"
        if (kind === "income" && /^போட்டி/.test(words[i].t)) continue;
        let clash = false;
        for (let k = i; k < i + n; k++) if (used[k]) clash = true;
        if (clash) continue;
        for (let k = i; k < i + n; k++) used[k] = true;
        hits.push({ i, n, kind, phrase: p, start: words[i].start, end: words[i + n - 1].end });
        break;
      }
    }
    return hits;
  }

  function directionHits(words) {
    const inc = findPhraseHits(words, CMD_INCOME_WORDS, "income", true);
    const exp = findPhraseHits(words, CMD_EXPENSE_WORDS, "expense", true);
    // same word claimed by both lists: keep the longer phrase
    const all = inc.concat(exp).sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const out = [];
    for (const h of all) {
      if (out.some((o) => !(h.end <= o.start || h.start >= o.end))) continue;
      out.push(h);
    }
    return out.sort((a, b) => a.start - b.start);
  }

  function isCurrencyWord(w) {
    return CMD_CURRENCY_AFTER_RE.test(w) && w.replace(CMD_CURRENCY_AFTER_RE, "").trim() === "";
  }

  function isDirectionWord(w) {
    const words = cmdWords(w);
    return words.length === 1 && directionHits(words).length === 1;
  }

  function nameish(w, menu) {
    const t = String(w || "").replace(/'s$/i, "").trim();
    if (t.length < 2) return false;
    if (/\d/.test(t)) return false;
    if (!/^[A-Za-z\u0B80-\u0BFF\u0900-\u097F.'-]+$/.test(t)) return false;
    const low = t.toLowerCase();
    if (LEFTOVER_STOP.has(low) || NAME_BLOCK.has(low) || SEPARATOR_WORDS.indexOf(low) !== -1) return false;
    if (WEAK_NAME_MARKERS.indexOf(low) !== -1) return false;
    if (parseTamilNumber(t) != null) return false;
    if (isCurrencyWord(t)) return false;
    if (isDirectionWord(t)) return false;
    if (findAllItemHits(t, menu).length) return false;
    if (findAlias(UNIT_ALIASES, t) && findAlias(UNIT_ALIASES, t).raw.length >= t.length - 1) return false;
    if (CMD_CREDIT_RE.test(t) || CMD_UPI_RE.test(t) || CMD_CASH_RE.test(t) || CMD_ADJ_RE.test(t)) return false;
    if (NAME_MARKERS.indexOf(low) !== -1) return false;
    return true;
  }

  function prettyName(n) {
    return String(n || "").trim().split(/\s+/).map((w) => /^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");
  }

  function nameMarkerHits(words) {
    return findPhraseHits(words, NAME_MARKERS, "name", false).filter((h) => {
      // bare English "name"/"account" only counts right after a name-like word
      if (/^(name|account|a\/c|s name)$/.test(h.phrase)) return h.i > 0;
      return true;
    });
  }

  /** Find "X பேருக்கு" / "X ke naam" / "Xच्या नावावर" / "X ka". Returns { name, text } with the phrase removed. */
  function extractName(text, menu) {
    const words = cmdWords(text);
    const strong = nameMarkerHits(words);
    for (const h of strong) {
      let k = h.i - 1;
      if (k < 0) continue;
      let nameWords = [];
      let w = words[k].t;
      if (/^(च्या|chya|che|cha)$/i.test(w) && k - 1 >= 0) { k -= 1; w = words[k].t; }
      if (/^(नावावर|नावाने|खात्यावर|खात्यात|navavar|naavavar|navane|khatyavar)$/i.test(h.phrase)) w = w.replace(MARATHI_POSSESSIVE_RE, "").replace(/(chya|che)$/i, "");
      w = w.replace(/'s$/i, "");
      if (!nameish(w, menu)) continue;
      nameWords.push(w);
      // Typed "Ravi Kumar peruku": a second capitalised latin word
      if (k - 1 >= 0 && /^[A-Z][a-z]+$/.test(words[k - 1].t) && /^[A-Z]/.test(w) && nameish(words[k - 1].t, menu)) {
        nameWords.unshift(words[k - 1].t);
        k -= 1;
      }
      const from = words[k].start;
      const to = h.end;
      // English "on Ravi's name" / "in Ravi name": drop the leading preposition too
      let cutFrom = from;
      if (k - 1 >= 0 && /^(on|in|for|under)$/i.test(words[k - 1].t) && /name|account|a\/c/.test(h.phrase)) cutFrom = words[k - 1].start;
      return { name: prettyName(nameWords.join(" ")), text: text.slice(0, cutFrom) + " " + text.slice(to), start: cutFrom, end: to, strong: true };
    }
    // Weak Hindi: "Ravi ka 100 chai"
    for (let i = 1; i < words.length; i++) {
      if (WEAK_NAME_MARKERS.indexOf(words[i].low) === -1) continue;
      const w = words[i - 1].t;
      if (!nameish(w, menu)) continue;
      return { name: prettyName(w), text: text.slice(0, words[i - 1].start) + " " + text.slice(words[i].end), start: words[i - 1].start, end: words[i].end, strong: false };
    }
    // Weak Marathi: "रवीचे 100"
    for (let i = 0; i < words.length; i++) {
      const w = words[i].t;
      if (!/[\u0900-\u097F]/.test(w) || !/(च्या|चे|चा|ची|ला)$/.test(w)) continue;
      if (isDirectionWord(w) || LEFTOVER_STOP.has(w) || NAME_BLOCK.has(w) || findAllItemHits(w, menu).length) continue;
      const stem = w.replace(/(च्या|चे|चा|ची|ला)$/, "");
      if (stem.replace(/[\u093E-\u094D\u0902\u0903]/g, "").length < 2 || !nameish(stem, menu)) continue;
      if ([...LEFTOVER_STOP, ...NAME_BLOCK].some((s) => s.length >= 2 && /[\u0900-\u097F]/.test(s) && stem.startsWith(s))) continue;
      return { name: stem, text: text.slice(0, words[i].start) + " " + text.slice(words[i].end), start: words[i].start, end: words[i].end, strong: false };
    }
    return { name: "", text };
  }

  function hasNumber(text) {
    return extractNumbersInOrder(text).length > 0;
  }

  function isScaleWordToken(w) {
    const toks = tokenize(stripNoise(w));
    return toks.length >= 1 && /^(hundred|thousand|lakh|crore)$/.test(toks[toks.length - 1].kind);
  }

  /** Split on commas / full stops / "and" / "um" / "aur" / "आणि" … */
  function splitSeparators(text) {
    // punctuation (keep "20,000" and "2.5" together)
    const rough = text.split(/\s*(?:;|\n|,(?!\d{2,3}(?!\d))|\.(?!\d)|!|\?)\s*/).map((x) => x.trim()).filter(Boolean);
    const out = [];
    for (const part of rough) {
      const words = cmdWords(part);
      let from = 0;
      for (let i = 0; i < words.length; i++) {
        if (SEPARATOR_WORDS.indexOf(words[i].low) === -1) continue;
        // "one hundred and fifty" stays one number
        if (i > 0 && i + 1 < words.length && isScaleWordToken(words[i - 1].t) && parseTamilNumber(words[i + 1].t) != null) continue;
        const left = part.slice(from, words[i].start).trim();
        if (left) out.push(left);
        from = words[i].end;
      }
      const tail = part.slice(from).trim();
      if (tail) out.push(tail);
    }
    return out;
  }

  /** Split one clause at add/minus verbs and name markers ("100 டீ ரவி பேருக்கு 50 வடை குமார் பேருக்கு"). */
  function splitAtMarkers(text, menu) {
    const words = cmdWords(text);
    if (words.length < 3) return [text];
    const marks = directionHits(words).map((h) => ({ i: h.i, n: h.n, kind: "dir" }))
      .concat(nameMarkerHits(words).map((h) => ({ i: h.i, n: h.n, kind: "name" })))
      .sort((a, b) => a.i - b.i);
    if (!marks.length) return [text];
    // merge adjacent markers into clusters ("peruku podu")
    const clusters = [];
    for (const m of marks) {
      const last = clusters[clusters.length - 1];
      if (last && m.i <= last.i + last.n) {
        last.n = Math.max(last.i + last.n, m.i + m.n) - last.i;
        if (m.kind === "name") last.hasName = true;
      } else clusters.push({ i: m.i, n: m.n, kind: m.kind, hasName: m.kind === "name" });
    }
    const cuts = [];
    let segStart = 0;
    for (const c of clusters) {
      const mStart = words[c.i].start;
      const mEnd = words[c.i + c.n - 1].end;
      if (mStart < segStart) continue;
      const before = text.slice(segStart, mStart);
      const rest = text.slice(mEnd);
      const nums = extractNumbersInOrder(before);
      if (!nums.length) continue;
      const firstNumAt = segStart + nums[0].start;
      const led = clusters.some((o) => o !== c && words[o.i].start >= segStart && words[o.i + o.n - 1].end <= firstNumAt);
      if (led) {
        if (!hasNumber(text.slice(mStart))) continue;
        let cut = mStart;
        if (c.hasName && c.i - 1 >= 0 && words[c.i - 1].start >= segStart && nameish(words[c.i - 1].t.replace(MARATHI_POSSESSIVE_RE, ""), menu)) cut = words[c.i - 1].start;
        if (cut <= segStart) continue;
        cuts.push(cut);
        segStart = cut;
      } else {
        if (!hasNumber(rest)) continue;
        cuts.push(mEnd);
        segStart = mEnd;
      }
    }
    if (!cuts.length) return [text];
    const parts = [];
    let p = 0;
    for (const c of cuts) { parts.push(text.slice(p, c).trim()); p = c; }
    parts.push(text.slice(p).trim());
    return parts.filter(Boolean);
  }

  /** "5 idli 3 tea" / "idli 5 tea 3" / "3 kg tomato 90 rs 2 kg onion 60 rs" → one piece per item. */
  function splitAtItems(text, menu) {
    const hits = findAllItemHits(text, menu);
    const nums = extractNumbersInOrder(text);
    if (hits.length < 2 || nums.length < 2) return [text];
    const numberFirst = nums[0].start < hits[0].start;
    const starts = [0];
    for (let k = 1; k < hits.length; k++) {
      if (numberFirst) {
        const gap = nums.filter((n) => n.start >= hits[k - 1].end && n.end <= hits[k].start);
        if (!gap.length) continue; // "idli dosa 50": no own number → keep together
        starts.push(gap[gap.length - 1].start);
      } else {
        const gap = nums.filter((n) => n.start >= hits[k - 1].end && n.end <= hits[k].start);
        if (!gap.length) continue;
        starts.push(hits[k].start);
      }
    }
    if (starts.length < 2) return [text];
    const parts = [];
    for (let k = 0; k < starts.length; k++) parts.push(text.slice(starts[k], k + 1 < starts.length ? starts[k + 1] : text.length).trim());
    return parts.filter(Boolean);
  }

  function protectVehicles(text) {
    const vehicles = [];
    let s = text;
    let guard = 0;
    let m;
    while ((m = s.match(CMD_VEHICLE_KEY_RE)) && guard++ < 5) {
      vehicles.push(normalizeVehicle(m[1]));
      s = s.replace(m[0], " §V" + (vehicles.length - 1) + "§ ");
    }
    guard = 0;
    let from = 0;
    while (guard++ < 5) {
      const sub = s.slice(from);
      m = sub.match(CMD_VEHICLE_BARE_RE);
      if (!m) break;
      const whole = m[0].slice(m[1].length);
      const at = from + m.index + m[1].length;
      const okState = INDIAN_STATE_CODES.test(m[2]);
      const looksTyped = /[A-Z]/.test(m[2]) || !/\s/.test(whole);
      if (okState && looksTyped) {
        vehicles.push(normalizeVehicle(whole));
        s = s.slice(0, at) + " §V" + (vehicles.length - 1) + "§ " + s.slice(at + whole.length);
        from = at + 5;
      } else {
        from = at + whole.length;
      }
    }
    return { text: s, vehicles };
  }

  function cleanLeftover(text, menu) {
    const words = cmdWords(text);
    const keep = [];
    for (const w of words) {
      let t = w.t.replace(/^[^\w\u0B80-\u0BFF\u0900-\u097F]+|[^\w\u0B80-\u0BFF\u0900-\u097F]+$/g, "");
      if (!t) continue;
      const low = t.toLowerCase();
      if (/^§V\d+§$/.test(t)) continue;
      if (LEFTOVER_STOP.has(low) || SEPARATOR_WORDS.indexOf(low) !== -1) continue;
      if (!/[A-Za-z\u0B85-\u0BB9\u0905-\u0939]/.test(t)) continue;
      if (/^\d/.test(t)) continue;
      if (parseTamilNumber(t) != null && !/[A-Za-z]{4,}/.test(t.replace(/^(?:hundred|thousand|lakh|crore)/i, ""))) continue;
      if (isCurrencyWord(t)) continue;
      keep.push(t);
    }
    return keep.join(" ").trim();
  }

  function removeSpans(text, spans) {
    let s = text;
    spans.slice().sort((a, b) => b.start - a.start).forEach((sp) => {
      s = s.slice(0, sp.start) + " ".repeat(Math.max(0, sp.end - sp.start)) + s.slice(sp.end);
    });
    return s;
  }

  /** Parse one piece ("100 ரூபா டீக்கு") into an entry draft, using the clause context for name / verb / payment. */
  function parseCommandPiece(pieceText, ctx, menu, options) {
    const raw = pieceText;
    let s = " " + pieceText + " ";
    let vehicleNo = "";
    s = s.replace(/§V(\d+)§/g, (m0, i) => {
      if (!vehicleNo) vehicleNo = (ctx.vehicles || [])[Number(i)] || "";
      return " ".repeat(m0.length);
    });
    if (!vehicleNo && ctx.vehicleNo) vehicleNo = ctx.vehicleNo;

    const adjMatch = s.match(CMD_ADJ_RE);
    let payMode = ctx.payMode || null;
    if (CMD_CREDIT_RE.test(s)) payMode = "credit";
    else if (CMD_UPI_RE.test(s)) payMode = "upi";
    else if (CMD_CASH_RE.test(s)) payMode = payMode || "cash";

    let name = "";
    const nm = extractName(s, menu);
    if (nm.name) { name = nm.name; s = nm.text; }
    if (!name && ctx.name) name = ctx.name;

    let words = cmdWords(s);
    const dHits = directionHits(words);
    let dir = null;
    let dirWord = "";
    if (dHits.length) {
      dir = dHits[dHits.length - 1].kind;
      dirWord = dHits[dHits.length - 1].phrase;
      s = removeSpans(s, dHits);
    }
    if (!dir && ctx.dir) { dir = ctx.dir; dirWord = ctx.dirWord || ""; }

    // Hindi "दो चाय" / "do chai" → qty 2 (but "दे दो" stays a verb)
    words = cmdWords(s);
    for (let k = 0; k + 1 < words.length; k++) {
      if (!/^(दो|do)$/i.test(words[k].t)) continue;
      const next = words[k + 1].t;
      if (findAllItemHits(next, menu).length || findAlias(UNIT_ALIASES, next)) {
        s = s.slice(0, words[k].start) + "2" + " ".repeat(words[k].t.length - 1) + s.slice(words[k].end);
      }
    }

    const nums = extractNumbersInOrder(s);
    const hits = findAllItemHits(s, menu);
    const hit = hits[0] || null;
    const unitHit = findAlias(UNIT_ALIASES, s);
    const menuRow = hit && hit.row.kind === "sale" ? hit.row : null;
    const price = menuRow && menuRow.price != null && Number(menuRow.price) > 0 ? Number(menuRow.price) : null;
    const cur = nums.find((n) => CMD_CURRENCY_AFTER_RE.test(s.slice(n.end)) || CMD_CURRENCY_BEFORE_RE.test(s.slice(0, n.start)));
    const others = nums.filter((n) => n !== cur);
    const adj = !!adjMatch;

    let qty = null;
    let unitPrice = null;
    let amount = null;
    let qtyGuess = false;
    let calcText = "";
    let rateUnit = "";
    // v8: per-unit rate ("கிலோ 50 ரூபா", "50 rupay kilo", "₹50 per kg") multiplies the quantity
    const rate = !adj ? findUnitRate(s, nums) : null;
    const qtyUnitNums = nums.filter((n) => unitAtStart(s.slice(n.end)));
    if (rate) {
      const qn = qtyUnitNums.find((n) => n !== rate.num && n !== rate.oneAt && !(rate.oneAt && n.start === rate.oneAt.start));
      unitPrice = rate.num.value;
      rateUnit = rate.unit;
      if (qn) {
        qty = qn.value;
        amount = roundMoney(qty * unitPrice);
        calcText = fmtNum(qty) + " " + unitEnLabel(rate.unit) + " × ₹" + fmtNum(unitPrice) + " = ₹" + fmtNum(amount);
      } else {
        qty = 1;
        amount = unitPrice;
      }
    } else if (cur) {
      if (others.length) {
        // a number right before a unit word is the quantity; the rupee number is the TOTAL
        const un = !menuRow ? (qtyUnitNums.find((n) => n !== cur) || null) : null;
        qty = (un || others[0]).value;
        if (!un && price && qty > 0 && Math.abs(cur.value - price) < Math.abs(cur.value - qty * price)) {
          unitPrice = cur.value;
          amount = roundMoney(qty * cur.value);
        } else {
          amount = cur.value;
          unitPrice = qty ? roundMoney(amount / qty) : null;
        }
      } else {
        amount = cur.value;
        if (price && amount > 0 && Math.abs(amount / price - Math.round(amount / price)) < 1e-9) {
          qty = Math.round(amount / price);
          unitPrice = price;
        }
      }
    } else if (nums.length >= 2) {
      const un = !menuRow ? qtyUnitNums[0] : null;
      if (un) {
        // "20 kg tomato 1000" / "tomato 1000 20 kg": quantity + unit, the other number is the total
        qty = un.value;
        const other = nums.find((n) => n !== un);
        amount = other.value;
        unitPrice = qty ? roundMoney(amount / qty) : null;
      } else {
        qty = nums[0].value;
        if (menuRow && dir !== "expense") {
          unitPrice = nums[1].value;
          amount = roundMoney(qty * unitPrice);
        } else {
          amount = nums[1].value;
          unitPrice = qty ? roundMoney(amount / qty) : null;
        }
      }
    } else if (nums.length === 1) {
      const v = nums[0].value;
      if (!menuRow && !adj && qtyUnitNums.length === 1) {
        // "ஒரு கிலோ தக்காளி" — a quantity with a unit but no price: ask for the amount
        qty = v;
        amount = null;
      } else if (menuRow && price && !adj && dir !== "expense" && (unitHit || (v > 0 && v <= 20))) {
        qty = v;
        unitPrice = price;
        amount = roundMoney(v * price);
        qtyGuess = !unitHit;
      } else {
        amount = v;
        if (price && v > 0 && Math.abs(v / price - Math.round(v / price)) < 1e-9) {
          qty = Math.round(v / price);
          unitPrice = price;
        }
      }
    } else if (menuRow && price && !adj && dir !== "expense") {
      qty = 1;
      unitPrice = price;
      amount = price;
    }
    // v8: spoken arithmetic result ("50 into 3 tea" → ₹150, 3 × ₹50)
    if (amount != null && ctx.calcs && ctx.calcs.length) {
      const c = ctx.calcs.find((x) => !x.used && Math.abs(x.result - amount) < 1e-9);
      if (c) {
        c.used = true;
        calcText = c.text;
        if (c.ops.length === 1 && c.ops[0] === "*" && (hit || unitHit)) {
          qty = Math.min(c.vals[0], c.vals[1]);
          unitPrice = Math.max(c.vals[0], c.vals[1]);
        }
      }
    }

    // Type: spoken verb first, then old keyword hints, then the item, then context.
    let type = dir;
    let typeGuessed = false;
    if (!type) {
      if (TYPE_EXPENSE_RE.test(raw)) type = "expense";
      else if (TYPE_INCOME_RE.test(raw)) type = "income";
    }
    if (!type && hit) type = hit.row.kind === "expense" ? "expense" : "income";
    if (!type && vehicleNo) type = "expense";
    if (!type && unitHit && /^(கிலோ|லிட்டர்|சிலிண்டர்)$/.test(unitHit.row.unit)) type = "expense";
    if (!type && ctx.inheritDir) type = ctx.inheritDir;
    if (!type) { type = "income"; typeGuessed = true; }

    let negative = false;
    let note = "";
    if (adj && amount != null && !/^(selavu|செலவு|kharcha|खर्च|expense)/i.test(dirWord) && !TYPE_EXPENSE_RE.test(raw)) {
      negative = true;
      type = "income";
      amount = -Math.abs(amount);
      qty = null;
      unitPrice = null;
      note = adjMatch[0];
    }

    // Leftover words → item (unknown item) or note (known item) or credit name.
    const spans = nums.map((n) => ({ start: n.start, end: n.end })).concat(hits.map((h) => ({ start: h.start, end: h.end })));
    let rest = removeSpans(s, spans);
    if (unitHit) rest = stripPhrase(rest, unitHit.raw);
    const g = (re) => new RegExp(re.source, "gi");
    rest = rest.replace(g(CMD_CREDIT_RE), " ").replace(g(CMD_UPI_RE), " ").replace(g(CMD_CASH_RE), " ").replace(g(CMD_ADJ_RE), " ");
    rest = rest.replace(g(TYPE_EXPENSE_RE), " ").replace(g(TYPE_INCOME_RE), " ");
    rest = rest.replace(/ரூவா|ரூபாய்|ரூபா|ருபாய்|rupees?|rupaye|rupiya|ruva|ruwa|ruvaa|\brs\b\.?|\binr\b|₹|रुपये|रुपए|रुपया|पैसे/gi, " ");
    let leftover = cleanLeftover(rest, menu);
    if (leftover) leftover = leftover.replace(/(^|\s)(per|prati|प्रति|प्रती|har|हर|each)(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim();

    if (payMode === "credit" && type === "income" && !name && leftover) {
      name = prettyName(leftover.split(" ").slice(0, 2).join(" "));
      leftover = "";
    }

    let item = "";
    let itemEn = "";
    if (negative) {
      item = "சரிகட்டு";
      itemEn = "Adjustment";
      if (leftover) note = (note + " " + leftover).trim();
    } else if (hit) {
      item = hit.row.nameTa;
      itemEn = hit.row.nameEn;
      if (leftover) note = leftover;
    } else if (leftover) {
      item = leftover;
    } else {
      item = type === "income" ? "வரவு" : "செலவு";
      itemEn = type === "income" ? "Income" : "Expense";
    }

    const unit = rateUnit || (qtyUnitNums.length && unitAtStart(s.slice(qtyUnitNums[0].end)).unit) || (unitHit && unitHit.row.unit) || (menuRow && menuRow.unit) || (qty != null && type === "income" ? "எண்ணிக்கை" : "");
    const base = {
      raw: String(raw).trim(),
      type,
      item,
      itemEn,
      qty,
      unit: qty != null ? unit : (unitHit ? unitHit.row.unit : ""),
      calc: calcText,
      category: "",
      unitPrice,
      amount: amount == null ? null : roundMoney(amount),
      vehicleNo: type === "expense" ? vehicleNo : "",
      note,
      payMode: payMode || "cash",
      customerName: name,
      negative,
      direction: dir || null
    };
    if (amount == null) {
      return Object.assign(base, { ok: false, error: "no-amount", needsCheck: true, uncertain: { amount: true }, uncertaintyReasons: ["missing-price"] });
    }
    if (base.payMode === "credit" && type === "income" && base.amount > 0 && !name) {
      return Object.assign(base, { ok: false, error: "customer-required", needsCheck: true, uncertain: { customer: true }, uncertaintyReasons: ["credit-needs-name"] });
    }
    const uncertain = {};
    const reasons = [];
    if (typeGuessed) { uncertain.type = true; reasons.push("type-unstated"); }
    if (!hit && !negative && leftover) { uncertain.item = true; reasons.push("unknown-item"); }
    if (qtyGuess) { uncertain.qty = true; reasons.push("number-ambiguous"); }
    const sc = options && options.speechConfidence;
    if (sc != null && sc > 0 && sc < 0.7) { uncertain.speech = true; reasons.push("low-speech-confidence"); }
    return Object.assign(base, {
      ok: true,
      confidence: dir || hit ? "high" : "medium",
      uncertain,
      uncertaintyReasons: reasons,
      needsCheck: reasons.length > 0
    });
  }

  /** Parse one clause: name / verb / payment found once, then split per item. */
  function parseCommandClause(text, ctx, menu, options) {
    const out = [];
    const nm = extractName(text, menu);
    let s = nm.name ? nm.text : text;
    const words = cmdWords(s);
    const dHits = directionHits(words);
    const clauseCtx = Object.assign({}, ctx, { name: nm.name || "" });
    if (dHits.length) {
      clauseCtx.dir = dHits[dHits.length - 1].kind;
      clauseCtx.dirWord = dHits[dHits.length - 1].phrase;
      s = removeSpans(s, dHits);
    }
    if (CMD_CREDIT_RE.test(text)) clauseCtx.payMode = "credit";
    else if (CMD_UPI_RE.test(text)) clauseCtx.payMode = "upi";
    let pieces = splitAtItems(s, menu);
    // vehicle placeholders sit in one piece; share with the expense pieces of this clause
    const vm = s.match(/§V(\d+)§/);
    if (vm) clauseCtx.vehicleNo = (ctx.vehicles || [])[Number(vm[1])] || "";
    for (const p of pieces) out.push(parseCommandPiece(p, clauseCtx, menu, options));
    return { entries: out, dir: clauseCtx.dir || null };
  }

  /**
   * One spoken or typed sentence → zero or more ledger drafts, saved without a confirm step.
   * Returns { ok, raw, entries, failed, paired, margin, needsSheet, error }.
   * needsSheet is true only when no amount could be read at all.
   */
  function parseCommand(text, options) {
    const raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "empty", raw: "", entries: [], failed: [], needsSheet: true };
    const menu = (options && options.menu) || defaultMenu();
    let norm = normalizeCommandText(raw);
    // v8: speech often splits the Tanglish dative: "murugan ukku" → "muruganukku"
    norm = norm.replace(/([A-Za-z]{2,})\s+(ukku|kku)(?=\s|$)/gi, "$1$2");
    // v8: misheard item words → nearest menu / purchase word
    let fixes = [];
    if (!options || options.fuzzy !== false) {
      const fz = fuzzyFixItems(norm, menu);
      norm = fz.text;
      fixes = fz.fixes;
    }
    const prot = protectVehicles(norm);
    const calcs = [];
    const ctxBase = { vehicles: prot.vehicles, calcs };

    // 1) separators, then merge pieces that carry neither a number nor an item into a neighbour
    let segs = splitSeparators(prot.text);
    // v8: "tamatar 5 kilo, kilo 40" — a bare per-unit rate belongs to the piece before it
    for (let i = segs.length - 1; i > 0; i--) {
      const sg = segs[i];
      const n = extractNumbersInOrder(sg);
      if (n.length === 1 && !findAllItemHits(sg, menu).length && findUnitRate(sg, n) && unitAtStart(segs[i - 1].slice((extractNumbersInOrder(segs[i - 1]).pop() || { end: 0 }).end))) {
        segs[i - 1] = segs[i - 1] + " " + sg;
        segs.splice(i, 1);
      }
    }
    // v8: spoken arithmetic inside each piece — but a spend/earn pair ("30 kazhi 50 varudhu") is never math
    let mathOnlyAll = segs.length > 0;
    segs = segs.map((sg) => {
      const pairTry = parsePairDeal(sg.replace(/§V\d+§/g, " "), Object.assign({}, options, { menu }));
      if (pairTry && pairTry.ok) { mathOnlyAll = false; return sg; }
      const m = applySpokenMath(sg);
      if (!m.calcs.length) { mathOnlyAll = false; return sg; }
      m.calcs.forEach((c) => calcs.push(c));
      if (!isBareMath(m.text)) mathOnlyAll = false;
      return m.text;
    });
    if (mathOnlyAll && calcs.length) {
      // only numbers and operators: show a calculator card, do not save
      const last = calcs[calcs.length - 1];
      return { ok: false, mathOnly: true, math: { expr: last.expr, result: last.result, text: last.text, all: calcs.map((c) => c.text) }, raw, entries: [], failed: [], needsSheet: false, error: "math-only", first: null };
    }
    // v8: money given to / received from people ("ரவிக்கு 2000, முருகனுக்கு 350 கொடுத்தேன்")
    const joined = segs.join(", ");
    const payEntries = parsePayments(joined, menu, { calcs });
    if (payEntries && payEntries.length) {
      // pieces of the sentence without a person keep the normal parse ("100 tea, Ravi ko 400 diye")
      const restSegs = segs.filter((sg) => !parsePaymentsTouches(sg, menu));
      const rest = restSegs.length ? parseCommand(restSegs.join(", "), Object.assign({}, options, { fuzzy: false })) : { entries: [], failed: [] };
      const all = payEntries.concat(rest.entries || []);
      return { ok: true, raw, entries: all, failed: rest.failed || [], paired: false, margin: null, needsSheet: false, needsCheck: all.some((e) => e.needsCheck), payments: true, fixes, first: all[0] };
    }
    const merged = [];
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      const hasStuff = hasNumber(sg.replace(/§V\d+§/g, " ")) || findAllItemHits(sg, menu).length > 0;
      if (!hasStuff) {
        if (i + 1 < segs.length) { segs[i + 1] = sg + " " + segs[i + 1]; continue; }
        if (merged.length) { merged[merged.length - 1] = merged[merged.length - 1] + " " + sg; continue; }
      }
      merged.push(sg);
    }
    segs = merged;

    const entries = [];
    const failed = [];
    let paired = false;
    let margin = null;
    let prevDir = null;
    for (const seg of segs) {
      // 2) the v6 spend/earn pair ("30 ரூவா கழி 50 ரூவா வருது") stays one unit
      const pair = parsePairDeal(seg.replace(/§V\d+§/g, " "), Object.assign({}, options, { menu }));
      if (pair && pair.ok) {
        paired = true;
        margin = (margin || 0) + pair.margin;
        const nm = extractName(seg, menu);
        pair.entries.forEach((e) => {
          if (nm.name && !e.customerName) e.customerName = nm.name;
          e.ok = true;
          entries.push(e);
        });
        continue;
      }
      // 3) verbs / name markers split one clause into several entries
      const clauses = splitAtMarkers(seg, menu);
      for (const cl of clauses) {
        const res = parseCommandClause(cl, Object.assign({}, ctxBase, { inheritDir: prevDir }), menu, options);
        res.entries.forEach((e) => {
          if (e.ok) entries.push(e);
          else failed.push(e);
        });
        if (res.dir) prevDir = res.dir;
      }
    }
    const onlyPair = paired && entries.length === 2 && entries.every((e) => e.pairRole);
    return {
      fixes,
      ok: entries.length > 0,
      raw,
      entries,
      failed,
      paired: onlyPair,
      margin: onlyPair ? margin : null,
      needsSheet: entries.length === 0,
      needsCheck: entries.some((e) => e.needsCheck),
      error: entries.length ? undefined : (failed[0] && failed[0].error) || "no-amount",
      first: entries[0] || failed[0] || null
    };
  }

  const VOICE_LANG = { ta: "ta-IN", en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
  function speechLangFor(lang) {
    return VOICE_LANG[lang] || "ta-IN";
  }

  const SUMMARY_TEXT = {
    ta: { acc: "கணக்கு", inc: "வரவு", exp: "செலவு", prof: "லாபம்", cash: "ரொக்கம்", credit: "கடன்", unpaid: "நிலுவைக் கடன்", top: "அதிகம் விற்றவை", shop: "கடை கணக்கு" },
    en: { acc: "Accounts", inc: "Income", exp: "Expense", prof: "Profit", cash: "Cash", credit: "Credit", unpaid: "Unpaid credit", top: "Top items", shop: "Kadai Tracker" },
    hi: { acc: "हिसाब", inc: "आमदनी", exp: "खर्च", prof: "मुनाफा", cash: "नकद", credit: "उधार", unpaid: "बाकी उधार", top: "सबसे ज़्यादा बिके", shop: "दुकान हिसाब" },
    mr: { acc: "हिशोब", inc: "जमा", exp: "खर्च", prof: "नफा", cash: "रोख", credit: "उधारी", unpaid: "बाकी उधारी", top: "सर्वाधिक विकले", shop: "दुकान हिशोब" }
  };

  /** WhatsApp summary in the chosen language (English line kept under Tamil/Hindi/Marathi). */
  const NAMES_HEAD = { ta: "பெயர் வாரியாக / By name", en: "By name", hi: "नाम से / By name", mr: "नावानुसार / By name" };
  const CREDIT_TAG = { ta: "கடன்", en: "credit", hi: "उधार", mr: "उधारी" };

  /** Lines listing entries saved with a person's name ("👤 Ravi: ₹100 — Tea"). */
  function namedSummaryLines(entries, date, lang) {
    const d = normalizeDate(date);
    const named = (entries || []).filter((e) => e && e.date === d && String(e.customerName || "").trim());
    if (!named.length) return [];
    const out = ["", NAMES_HEAD[lang] || NAMES_HEAD.en + ":"];
    if (out[1].slice(-1) !== ":") out[1] += ":";
    named.forEach((e) => {
      const sign = e.type === "expense" ? "−" : "";
      const qu = qtyUnitLabel(e, lang === "en" ? null : lang);
      const item = e.item ? " — " + itemLabel(e.item, lang || "ta") + (qu && e.unit && e.unit !== "எண்ணிக்கை" ? " " + qu : "") : "";
      const cr = e.payMode === "credit" && !e.creditPaid ? " (" + (CREDIT_TAG[lang] || CREDIT_TAG.en) + ")" : "";
      out.push("👤 " + String(e.customerName).trim() + ": " + sign + "₹" + Math.abs(Number(e.amount) || 0) + item + cr);
    });
    return out;
  }

  const BOUGHT_HEAD = { ta: "வாங்கியவை / Bought", en: "Bought", hi: "खरीदा / Bought", mr: "खरेदी / Bought" };
  /** Purchases with a quantity: "தக்காளி 20 கிலோ (20 kg) — ₹1000". */
  function boughtSummaryLines(entries, date, lang) {
    const d = normalizeDate(date);
    const list = (entries || []).filter((e) => e && !e.deleted && e.date === d && e.type === "expense" && e.qty != null && e.unit && e.unit !== "எண்ணிக்கை");
    if (!list.length) return [];
    const out = ["", (BOUGHT_HEAD[lang] || BOUGHT_HEAD.en) + ":"];
    list.forEach((e) => {
      const local = qtyUnitLabel(e, lang === "en" ? null : lang);
      const en = qtyUnitLabel(e);
      out.push("• " + itemLabel(e.item, lang || "ta") + " " + local + (local !== en ? " (" + en + ")" : "") + " — ₹" + Math.abs(Number(e.amount) || 0));
    });
    return out;
  }

  function daySummaryTextLang(entries, date, shopName, lang) {
    if (!lang || lang === "ta") return [daySummaryText(entries, date, shopName)].concat(boughtSummaryLines(entries, date, "ta"), namedSummaryLines(entries, date, "ta")).join("\n");
    const L1 = SUMMARY_TEXT[lang] || SUMMARY_TEXT.en;
    const E = SUMMARY_TEXT.en;
    const both = (k) => (lang === "en" ? E[k] : L1[k] + " / " + E[k]);
    const d = normalizeDate(date);
    const t = computeTotals(entries, d);
    const pay = paymentBreakdown(entries, d);
    const top = topSelling(entries, d, d, 5);
    const lines = [
      shopName || L1.shop,
      both("acc") + " — " + d,
      "",
      both("inc") + ": ₹" + t.income,
      both("exp") + ": ₹" + t.expense,
      both("prof") + ": ₹" + t.profit,
      "",
      both("cash") + ": ₹" + pay.cash,
      "UPI: ₹" + pay.upi,
      both("credit") + ": ₹" + pay.credit,
      both("unpaid") + ": ₹" + pay.unpaidCredit
    ];
    if (top.length) {
      lines.push("", both("top") + ":");
      top.forEach((x, i) => {
        lines.push(i + 1 + ". " + itemLabel(x.item, lang) + " — ₹" + x.amount + (x.qty ? " (" + qtyUnitLabel({ qty: x.qty, unit: x.unit }, lang === "en" ? null : lang) + ")" : ""));
      });
    }
    return lines.concat(boughtSummaryLines(entries, date, lang), namedSummaryLines(entries, date, lang)).join("\n");
  }


  /* =====================================================================
   * v8: units + per-unit rates, spoken arithmetic, payments to people,
   *     fuzzy item / name matching, best speech alternative.
   * ===================================================================== */

  // ---------- units ----------
  function unitWordList() {
    const out = [];
    UNIT_ALIASES.forEach((row) => row.names.forEach((n) => out.push({ n, unit: row.unit, en: row.en })));
    return out.sort((a, b) => b.n.length - a.n.length);
  }
  /** Unit word at the start of str (after spaces). Latin needs a word end; Tamil/Devanagari may carry a suffix. */
  function unitAtStart(str) {
    const m = String(str || "").match(/^\s*/);
    const rest = String(str || "").slice(m[0].length);
    const low = rest.toLowerCase();
    for (const u of unitWordList()) {
      const n = u.n.toLowerCase();
      if (!low.startsWith(n)) continue;
      if (n.charCodeAt(0) < 128 && /^[a-z]/i.test(rest.slice(n.length))) continue;
      let len = n.length;
      const tail = rest.slice(len).match(/^[\u0B80-\u0BFF\u0900-\u097F]*/)[0];
      if (n.charCodeAt(0) >= 128) len += tail.length;
      return { unit: u.unit, en: u.en, raw: rest.slice(0, len), start: m[0].length, end: m[0].length + len };
    }
    return null;
  }
  /** Unit word ending str (optionally followed by ka/ke/ku/க்கு/का/ला …). */
  function unitAtEnd(str) {
    let s = String(str || "").replace(/\s+$/, "");
    s = s.replace(/\s*(?:₹|rs\.?|रु\.?|ரூ\.?)$/i, "").replace(/\s+$/, "");
    s = s.replace(/(?:^|\s)(?:ka|ke|ki|ku|kku|ukku|ko|का|के|की|को|ला|ची|चा|चे|per|ஒன்னுக்கு|ஒண்ணுக்கு)$/i, "").replace(/\s+$/, "");
    const low = s.toLowerCase();
    for (const u of unitWordList()) {
      const n = u.n.toLowerCase();
      const latin = n.charCodeAt(0) < 128;
      let idx = -1;
      if (latin) {
        if (low.endsWith(n) && !/[a-z]$/i.test(low.slice(0, low.length - n.length))) idx = low.length - n.length;
      } else {
        const re = new RegExp(escapeReg(u.n) + "[\\u0B80-\\u0BFF\\u0900-\\u097F]*$");
        const mm = s.match(re);
        if (mm && !/[\u0B80-\u0BFF\u0900-\u097F]$/.test(s.slice(0, mm.index))) idx = mm.index;
      }
      if (idx !== -1) return { unit: u.unit, en: u.en, start: idx, before: s.slice(0, idx) };
    }
    return null;
  }
  const RATE_PER_RE = /^\s*(?:per|\/|प्रति|प्रती|har|हर|each|a|an|one|ஒரு|ek|एक)\s*/i;

  /**
   * "கிலோ 50 ரூபா", "50 rupay kilo", "₹50 per kg", "kilo ka 50", "किलो 50" → { num, unit }.
   * The number right before a unit word with no currency/per in between is a QUANTITY, not a rate.
   */
  function findUnitRate(s, nums) {
    for (const n of nums) {
      const after = s.slice(n.end);
      const cur = after.match(CMD_CURRENCY_AFTER_RE);
      let rest = cur ? after.slice(cur[0].length) : after;
      const per = rest.match(RATE_PER_RE);
      if (per) rest = rest.slice(per[0].length);
      const u = unitAtStart(rest);
      if (u && (cur || per)) return { num: n, unit: u.unit, en: u.en, how: "after" };
    }
    for (const n of nums) {
      const before = s.slice(0, n.start);
      const u = unitAtEnd(before);
      if (!u) continue;
      // "3 கிலோ 50" = 3 kg for ₹50 (quantity, then total) — not a rate
      const prevNum = extractNumbersInOrder(u.before).pop();
      const gapBefore = prevNum ? u.before.slice(prevNum.end).trim() : null;
      if (prevNum && gapBefore === "" && prevNum.value !== 1) continue;
      if (prevNum && gapBefore === "" && prevNum.value === 1) {
        // "ஒரு கிலோ 50" is a rate only when another quantity + unit is said too
        const others = nums.filter((x) => x !== n && x !== prevNum && x.start !== prevNum.start && unitAtStart(s.slice(x.end)));
        if (!others.length) continue;
      }
      return { num: n, unit: u.unit, en: u.en, how: "before", oneAt: prevNum && gapBefore === "" ? prevNum : null };
    }
    return null;
  }
  function unitEnLabel(unit) {
    const row = UNIT_NAMES[String(unit || "")];
    return row ? row.en : String(unit || "");
  }
  function fmtNum(n) {
    const r = Math.round(Number(n) * 100) / 100;
    return String(r);
  }

  // ---------- arithmetic ----------
  const MATH_OPS = [
    { op: "*", sym: "×", words: ["multiplied by", "multiply by", "multiplied", "multiply", "into", "times", "x", "×", "*", "guna", "gune", "gunaa", "गुणा", "गुणे", "गुणिले", "गुणित", "पट", "பெருக்கல்", "பெருக்கு", "பெருக்கி", "பெருக்கினா", "perukku", "perukkal", "perukki", "perukkuna"] },
    { op: "/", sym: "÷", words: ["divided by", "divide by", "divided", "divide", "by", "/", "÷", "bhaag", "bhag", "bhaga", "भाग", "भागा", "भागिले", "बटा", "bata", "வகுத்தல்", "வகுத்து", "வகுத்தா", "வகு", "vagu", "vaguthu", "vagutha", "vaguththu"] },
    { op: "+", sym: "+", words: ["plus", "+", "கூட்டல்", "கூட்டு", "கூட்டி", "கூட்டினா", "சேர்த்து", "சேர்", "பிளஸ்", "koottu", "kootu", "kootti", "koottal", "ser", "serthu", "jodo", "jod", "jodna", "jor", "जोडो", "जोड", "जोडना", "बेरीज", "अधिक", "adhik", "प्लस", "मिलाओ", "milao"] },
    { op: "-", sym: "−", words: ["minus", "−", "-", "கழித்தல்", "கழிச்சா", "கழித்து", "கழி", "மைனஸ்", "kazhi", "kalichu", "kazhichu", "ghatao", "ghata", "घटाओ", "घटा", "वजा", "उणे", "माइनस", "मायनस"] }
  ];
  function mathOpOf(gap) {
    let g = String(gap || "").trim();
    // currency words around the operator are fine: "50 ரூபா into 3"
    for (let k = 0; k < 2; k++) {
      g = g.replace(CMD_CURRENCY_AFTER_RE, "").trim();
      g = g.replace(/\s*(?:ரூவா|ரூபாய்|ரூபா|rupees?|rupay|rupaye|rs\.?|₹|रुपये|रुपए)$/i, "").trim();
    }
    if (!g) return null;
    const low = g.toLowerCase();
    for (const o of MATH_OPS) {
      for (const w of o.words) {
        if (low === w.toLowerCase()) return o;
        // Tamil verb forms: "கழிச்சுடு", "பெருக்கினா" (prefix of one word)
        if (w.charCodeAt(0) >= 0x0B80 && w.charCodeAt(0) <= 0x0BFF && !/\s/.test(g) && g.startsWith(w) && w.length >= 3) return o;
      }
    }
    return null;
  }
  function evalOps(vals, ops) {
    const v = vals.slice();
    const o = ops.slice();
    for (let i = 0; i < o.length; ) {
      if (o[i].op === "*" || o[i].op === "/") {
        if (o[i].op === "/" && v[i + 1] === 0) return null;
        const r = o[i].op === "*" ? v[i] * v[i + 1] : v[i] / v[i + 1];
        v.splice(i, 2, r);
        o.splice(i, 1);
      } else i += 1;
    }
    let r = v[0];
    for (let i = 0; i < o.length; i++) r = o[i].op === "+" ? r + v[i + 1] : r - v[i + 1];
    return roundMoney(r);
  }

  /**
   * Find spoken arithmetic ("50 into 3", "1000 வகு 4", "200 plus 300") and replace each
   * expression with its result marked as rupees. Returns { text, calcs }.
   * Precedence: × and ÷ before + and −; otherwise left to right.
   */
  function applySpokenMath(text) {
    const s = String(text || "");
    const nums = extractNumbersInOrder(s);
    const calcs = [];
    if (nums.length < 2) return { text: s, calcs };
    const groups = [];
    let cur = null;
    for (let i = 0; i + 1 < nums.length; i++) {
      const a = nums[i];
      const b = nums[i + 1];
      let op = null;
      let bVal = b.value;
      if (/^-/.test(b.raw) && s.slice(a.end, b.start).trim() === "") { op = MATH_OPS[3]; bVal = Math.abs(b.value); }
      else op = mathOpOf(s.slice(a.end, b.start));
      if (!op) { cur = null; continue; }
      if (!cur) { cur = { first: i, nums: [a], vals: [Math.abs(a.value)], ops: [] }; groups.push(cur); }
      cur.nums.push(b);
      cur.vals.push(bVal);
      cur.ops.push(op);
    }
    if (!groups.length) return { text: s, calcs };
    let out = s;
    for (let g = groups.length - 1; g >= 0; g--) {
      const gr = groups[g];
      const result = evalOps(gr.vals, gr.ops);
      if (result == null) continue;
      const start = gr.nums[0].start;
      const end = gr.nums[gr.nums.length - 1].end;
      let expr = fmtNum(gr.vals[0]);
      gr.ops.forEach((o, k) => { expr += " " + o.sym + " " + fmtNum(gr.vals[k + 1]); });
      const curAfter = CMD_CURRENCY_AFTER_RE.test(out.slice(end));
      out = out.slice(0, start) + fmtNum(result) + (curAfter ? "" : " rupees") + out.slice(end);
      calcs.unshift({ expr, result, text: expr + " = ₹" + fmtNum(result), ops: gr.ops.map((o) => o.op), vals: gr.vals.slice(), used: false });
    }
    return { text: out, calcs };
  }

  /** Text left after removing numbers, currency and filler — empty means "math only". */
  function isBareMath(text) {
    let t = String(text || "");
    extractNumbersInOrder(t).slice().reverse().forEach((n) => { t = t.slice(0, n.start) + " " + t.slice(n.end); });
    t = t.replace(/ரூவா|ரூபாய்|ரூபா|rupees?|rupay|rupaye|\brs\b\.?|₹|रुपये|रुपए|=|equals?|evvalavu|எவ்வளவு|எத்தனை|kitna|kitne|कितना|कितने|किती|how much|is|what|ennaa|enna|என்ன|ஆகும்|aagum|hota|hai|होता|है|होते|हैं|झाले|होतात|\?/gi, " ");
    return t.trim() === "";
  }

  // ---------- payments to / from people ----------
  const GIVE_OUT_WORDS = [
    "கொடுத்தேன்", "குடுத்தேன்", "கொடுத்தோம்", "குடுத்தோம்", "கொடுத்துட்டேன்", "குடுத்துட்டேன்", "கொடுத்திட்டேன்", "கொடுத்திருக்கேன்", "குடுத்திருக்கேன்", "கொடுத்தது", "குடுத்தது",
    "koduthen", "kuduthen", "kodutten", "kudutten", "koduthom", "kuduthom", "koduthutten", "kuduthutten", "koduthuten", "kuduthuten", "kodutthen", "kudutthen",
    "paid", "gave", "given", "pay", "paying",
    "diye", "diya", "diyе", "de diya", "de diye", "दिए", "दिया", "दिये", "दे दिया", "दे दिए", "दिले", "दिला", "दिली", "दिलेत", "dile", "dila", "dili", "chukaya", "चुकाया", "bhare", "भरले"
  ];
  // Third-person "he/she gave" (to me) — or verbs that mean "received / got".
  const GIVE_IN_WORDS = [
    "கொடுத்தான்", "குடுத்தான்", "கொடுத்தாங்க", "குடுத்தாங்க", "கொடுத்தார்", "குடுத்தார்", "கொடுத்தா", "குடுத்தா", "கொடுத்தாள்", "குடுத்தாள்", "கொடுத்திருக்கான்", "குடுத்திருக்கான்", "கொடுத்திருக்காங்க", "குடுத்திருக்காங்க", "கொடுத்திருக்கார்",
    "koduthan", "kuduthan", "koduthaan", "kuduthaan", "koduthaanga", "kuduthaanga", "kodutthaan", "koduthar", "kuduthar", "koduthirukkan", "kuduthirukkan", "koduthirukkaan", "kuduthirukkaan",
    "received", "got", "receive", "returned",
    "mila", "mile", "mili", "मिला", "मिले", "मिली", "मिळाले", "मिळाला", "मिळाली", "milale", "milala", "lauta", "लौटाए", "लौटाया", "parat", "परत",
    "வாங்கினேன்", "வாங்குனேன்", "vaanginen", "vaangunen"
  ];
  const WAGE_WORDS_RE = /(சம்பளம்|சம்பளம|கூலி|அட்வான்ஸ்|முன்பணம்|sambalam|samBalam|kooli|cooli|advance|salary|wage|wages|pagaar|pagar|पगार|तनख्वाह|तनखा|tankhwah|tankha|majduri|mazdoori|मजदूरी|वेतन|vetan|उचल|uchal|आगाऊ)/i;
  const ADVANCE_RE = /(அட்வான்ஸ்|முன்பணம்|advance|एडवांस|उचल|uchal|आगाऊ|பெருசா முன்)/i;
  const WORKER_WORDS = ["வேலைக்காரன்", "வேலைக்காரர்", "வேலைக்காரி", "வேலையாள்", "வேலையாளு", "velaikaran", "velaikkaran", "velaikaaran", "worker", "helper", "naukar", "नौकर", "kamgar", "कामगार", "कारीगर", "karigar", "staff", "பையன்", "payyan", "chotu", "छोटू", "कर्मचारी", "karmachari", "naukar", "नोकर"];
  const SELF_DATIVE = new Set(["எனக்கு", "எனக்கும்", "நமக்கு", "நமக்கும்", "உனக்கு", "enakku", "ennaku", "enaku", "namakku", "unakku", "mujhe", "मुझे", "मला", "mala", "hame", "हमें", "me", "mujhko"]);

  function tamilDativeStem(w) {
    const t = String(w || "");
    if (SELF_DATIVE.has(t) || SELF_DATIVE.has(t.toLowerCase())) return "";
    if (/[\u0B80-\u0BFF]/.test(t)) {
      if (/வுக்கு$/.test(t)) return t.replace(/வுக்கு$/, "");
      if (/யுக்கு$/.test(t)) return t.replace(/யுக்கு$/, "");
      if (/ுக்கு$/.test(t)) {
        let st = t.replace(/ுக்கு$/, "்");
        // "பில்லுக்கு" → "பில்" (doubled consonant before the case ending)
        const dbl = st.match(/(.)்\1்$/);
        if (dbl) st = st.slice(0, -2);
        return st;
      }
      if (/க்கு$/.test(t)) return t.replace(/க்கு$/, "");
      if (/கிட்ட$|கிட்டே$|கிட்டயிருந்து$|கிட்டேருந்து$|கிட்டஇருந்து$/.test(t)) return "";
      return "";
    }
    const m = t.match(/^([A-Za-z]{2,}?)(ukku|kku|uku|ku)$/i);
    if (m && m[1].length >= 3) return m[1];
    return "";
  }
  const GENERIC_PERSON = new Set(["ஒருத்தன்", "ஒருத்தர்", "ஒருத்தி", "ஒருவர்", "ஒருவன்", "ஆள்", "oruthan", "oruthar", "oruthi", "koi", "कोई", "ekala", "एकाला"]);
  function isPersonWord(w, menu) {
    if (!w) return false;
    if (GENERIC_PERSON.has(w) || GENERIC_PERSON.has(String(w).toLowerCase())) return true;
    if (!nameish(w, menu)) return false;
    if (WAGE_WORDS_RE.test(w) && !WORKER_WORDS.some((x) => w.toLowerCase().startsWith(x.toLowerCase()))) return false;
    if (unitAtStart(w)) return false;
    return true;
  }
  function personLabel(w) {
    return prettyName(String(w || "").replace(/'s$/i, ""));
  }

  /**
   * "ரவிக்கு 2000, முருகனுக்கு 350 கொடுத்தேன்" / "Ravi ko 400 diye" / "रवीला 400 दिले" (paid out → expense)
   * "ரவி எனக்கு 500 கொடுத்தான்" / "Ravi ne 500 diya" / "रवीने 500 दिले" / "500 from Ravi" (received → income)
   * Returns null when the sentence is not about giving money to / getting money from people.
   */
  function parsePayments(text, menu, options) {
    const s = String(text || "");
    const words = cmdWords(s);
    if (!words.length) return null;
    const outHits = findPhraseHits(words, GIVE_OUT_WORDS, "out", true);
    const inHits = findPhraseHits(words, GIVE_IN_WORDS, "in", true).filter((h) => !outHits.some((o) => !(h.end <= o.start || h.start >= o.end)));
    if (!outHits.length && !inHits.length) return null;
    // a menu item or a purchase item means this is an ordinary sale / purchase ("tea 50 diye")
    const persons = [];
    const usedWord = new Set();
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const low = w.low;
      const prev = words[i - 1];
      const next = words[i + 1];
      // Tamil / Tanglish dative "ரவிக்கு", "Muruganukku"
      const stem = tamilDativeStem(w.t);
      if (stem && isPersonWord(stem, menu) && !findAllItemHits(w.t, menu).length) {
        persons.push({ i, name: personLabel(stem), dir: "out", start: w.start, end: w.end });
        usedWord.add(i);
        continue;
      }
      // "X எனக்கு" (X gave me) / "X kitta" / "X கிட்ட"
      if (/^(எனக்கு|enakku|ennaku|enaku|நமக்கு|namakku)$/i.test(w.t) && prev && !usedWord.has(i - 1) && isPersonWord(prev.t, menu)) {
        persons.push({ i: i - 1, name: personLabel(prev.t), dir: "in", start: prev.start, end: w.end });
        usedWord.add(i - 1); usedWord.add(i);
        continue;
      }
      if (/^(கிட்ட|கிட்டே|கிட்டயிருந்து|கிட்டேருந்து|kitta|kitte|kittendhu|kittaiyirundhu|kadun|कडून|se|से|from)$/i.test(w.t)) {
        // "from Ravi" (English: name after), others: name before
        if (/^from$/i.test(w.t) && next && isPersonWord(next.t, menu)) {
          persons.push({ i: i + 1, name: personLabel(next.t), dir: "in", start: w.start, end: next.end });
          usedWord.add(i); usedWord.add(i + 1);
          i += 1;
          continue;
        }
        if (prev && !usedWord.has(i - 1) && isPersonWord(prev.t, menu)) {
          persons.push({ i: i - 1, name: personLabel(prev.t), dir: "in", start: prev.start, end: w.end });
          usedWord.add(i - 1); usedWord.add(i);
          continue;
        }
      }
      // Marathi "रवीकडून" / "रवीने"
      if (/[\u0900-\u097F]/.test(w.t) && /(कडून|ने)$/.test(w.t)) {
        const st = w.t.replace(/(कडून|ने)$/, "");
        if (st.replace(/[\u093E-\u094D\u0902\u0903]/g, "").length >= 2 && isPersonWord(st, menu)) {
          persons.push({ i, name: st, dir: "in", start: w.start, end: w.end });
          usedWord.add(i);
          continue;
        }
      }
      // Hindi "Ravi ne" (received) / "Ravi ko" (paid)
      if (/^(ne|ने)$/i.test(w.t) && prev && !usedWord.has(i - 1) && isPersonWord(prev.t, menu)) {
        persons.push({ i: i - 1, name: personLabel(prev.t), dir: "in", start: prev.start, end: w.end });
        usedWord.add(i - 1); usedWord.add(i);
        continue;
      }
      if (/^(ko|को)$/i.test(w.t) && prev && !usedWord.has(i - 1) && isPersonWord(prev.t, menu)) {
        persons.push({ i: i - 1, name: personLabel(prev.t), dir: "out", start: prev.start, end: w.end });
        usedWord.add(i - 1); usedWord.add(i);
        continue;
      }
      // Marathi dative "रवीला"
      if (/[\u0900-\u097F]/.test(w.t) && /ला$/.test(w.t) && !/^(मला|आम्हाला|तुला|त्याला|तिला)$/.test(w.t)) {
        const st = w.t.replace(/ला$/, "");
        if (st.replace(/[\u093E-\u094D\u0902\u0903]/g, "").length >= 2 && isPersonWord(st, menu)) {
          persons.push({ i, name: st, dir: "out", start: w.start, end: w.end });
          usedWord.add(i);
          continue;
        }
      }
      // English "to Ravi", "paid Ravi 400", "gave Ravi 400"
      if (/^to$/i.test(w.t) && next && isPersonWord(next.t, menu)) {
        persons.push({ i: i + 1, name: personLabel(next.t), dir: "out", start: w.start, end: next.end });
        usedWord.add(i); usedWord.add(i + 1);
        i += 1;
        continue;
      }
      if (/^(paid|gave|pay)$/i.test(w.t) && next && /^[A-Za-z]/.test(next.t) && isPersonWord(next.t, menu) && !/^(to|for|the)$/i.test(next.t)) {
        persons.push({ i: i + 1, name: personLabel(next.t), dir: "out", start: next.start, end: next.end });
        usedWord.add(i + 1);
        i += 1;
        continue;
      }
    }
    // Nominative + third-person verb: "ரவி 500 கொடுத்தான்", "Ravi gave 500"
    if (!persons.length && inHits.length) {
      const verbI = inHits[0].i;
      for (let i = 0; i < words.length; i++) {
        if (i === verbI || usedWord.has(i)) continue;
        if (!/^[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(words[i].t)) continue;
        if (findPhraseHits([words[i]], GIVE_IN_WORDS.concat(GIVE_OUT_WORDS), "v", true).length) continue;
        if (/^(ரூவா|ரூபா|ரூபாய்)/.test(words[i].t)) continue;
        if (isPersonWord(words[i].t, menu) && !hasNumber(words[i].t) && (/[\u0B80-\u0BFF\u0900-\u097F]/.test(words[i].t) || /^[A-Z]/.test(words[i].t) || words.length <= 4)) {
          if (/^(gave|got|received)$/i.test(words[i].t)) continue;
          persons.push({ i, name: personLabel(words[i].t), dir: "in", start: words[i].start, end: words[i].end });
          break;
        }
      }
    }
    if (!persons.length) return null;
    // A sale item in the sentence ("Ravi ko 2 chai diye") is not a money payment.
    const itemHits = findAllItemHits(s, menu).filter((h) => !persons.some((p) => !(h.end <= p.start || h.start >= p.end)));
    if (itemHits.some((h) => h.row.kind === "sale")) return null;

    // Verb decides the default direction: "கொடுத்தேன்" (I gave) = out, "கொடுத்தான்" (he gave) = in.
    const verbDir = outHits.length ? "out" : "in";
    // Group: each person owns the numbers up to the next person (or before it, for "400 to Ravi").
    let blanked = s;
    persons.slice().sort((a, b) => b.start - a.start).forEach((p) => { blanked = blanked.slice(0, p.start) + " ".repeat(p.end - p.start) + blanked.slice(p.end); });
    outHits.concat(inHits).forEach((h) => { blanked = blanked.slice(0, h.start) + " ".repeat(h.end - h.start) + blanked.slice(h.end); });
    const nums = extractNumbersInOrder(blanked);
    if (!nums.length) return null;
    persons.sort((a, b) => a.start - b.start);
    const personFirst = persons[0].start < nums[0].start;
    const groups = persons.map((p) => ({ p, nums: [] }));
    for (const n of nums) {
      let g = null;
      if (personFirst) {
        for (const gr of groups) if (gr.p.start <= n.start) g = gr;
      } else {
        for (const gr of groups) { if (gr.p.start >= n.end) { g = gr; break; } }
        if (!g) g = groups[groups.length - 1];
      }
      if (g) g.nums.push(n);
    }
    // one person, several numbers in Tamil verb-final speech: "ரவிக்கு 2000 முருகனுக்கு 350" handled above
    const calcs = (options && options.calcs) || [];
    const payUpi = CMD_UPI_RE.test(s);
    const entries = [];
    for (let gi = 0; gi < groups.length; gi++) {
      const gr = groups[gi];
      if (!gr.nums.length) continue;
      const segEnd = gi + 1 < groups.length ? groups[gi + 1].p.start : s.length;
      const segText = s.slice(personFirst ? gr.p.start : 0, segEnd);
      const curN = gr.nums.find((n) => CMD_CURRENCY_AFTER_RE.test(blanked.slice(n.end)) || CMD_CURRENCY_BEFORE_RE.test(blanked.slice(0, n.start)));
      const n = curN || gr.nums[gr.nums.length - 1];
      let dir = gr.p.dir;
      if (gr.p.dir === "out" && verbDir === "in" && !outHits.length) dir = "out"; // "X-க்கு கொடுத்திருக்கான்": still paid to X
      const isOut = dir === "out";
      const isWorker = WORKER_WORDS.some((x) => gr.p.name.toLowerCase().startsWith(x.toLowerCase()));
      const wage = isOut && (WAGE_WORDS_RE.test(segText) || isWorker);
      const advance = wage && ADVANCE_RE.test(segText);
      const amount = roundMoney(Math.abs(n.value));
      const calc = calcs.find((c) => !c.used && Math.abs(c.result - amount) < 1e-9);
      if (calc) calc.used = true;
      const item = wage ? (advance ? "முன்பணம்" : "கூலி") : isOut ? "கொடுத்தது" : "பெற்றது";
      entries.push({
        ok: true,
        raw: segText.trim(),
        type: isOut ? "expense" : "income",
        item,
        itemEn: wage ? (advance ? "Advance" : "Wages") : isOut ? "Paid to" : "Received from",
        qty: null,
        unit: "",
        unitPrice: null,
        amount,
        vehicleNo: "",
        note: "",
        payMode: payUpi ? "upi" : "cash",
        customerName: gr.p.name,
        negative: false,
        direction: isOut ? "expense" : "income",
        category: wage ? "wage" : isOut ? "paid-to" : "received-from",
        wageKind: wage ? (advance ? "advance" : "daily") : "",
        staffHint: wage || isWorker,
        calc: calc ? calc.text : "",
        confidence: "high",
        uncertain: {},
        uncertaintyReasons: [],
        needsCheck: false
      });
    }
    return entries.length ? entries : null;
  }

  /** Does this piece carry a person + money-giving pattern of its own (or a bare "name-க்கு 2000")? */
  function parsePaymentsTouches(seg, menu) {
    const words = cmdWords(seg);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const stem = tamilDativeStem(w.t);
      if (stem && isPersonWord(stem, menu)) return true;
      if (/^(ko|को|ne|ने|से|kitta|கிட்ட|எனக்கு|enakku|to|from)$/i.test(w.t)) return true;
      if (/[\u0900-\u097F]/.test(w.t) && /(ला|ने|कडून)$/.test(w.t) && !/^(मला)$/.test(w.t)) return true;
    }
    return findPhraseHits(words, GIVE_OUT_WORDS.concat(GIVE_IN_WORDS), "v", true).length > 0 && !findAllItemHits(seg, menu).length;
  }

  // ---------- fuzzy matching (noisy speech) ----------
  function editDistance(a, b, cap) {
    const A = Array.from(a);
    const B = Array.from(b);
    if (Math.abs(A.length - B.length) > cap) return cap + 1;
    let prev = new Array(B.length + 1);
    for (let j = 0; j <= B.length; j++) prev[j] = j;
    for (let i = 1; i <= A.length; i++) {
      const curr = [i];
      let best = i;
      for (let j = 1; j <= B.length; j++) {
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
        if (curr[j] < best) best = curr[j];
      }
      if (best > cap) return cap + 1;
      prev = curr;
    }
    return prev[B.length];
  }
  function fuzzyCap(len) {
    return len >= 8 ? 2 : len >= 4 ? 1 : 0;
  }
  /** Known name closest to `name` (one or two letters off), else "". */
  function matchKnownName(name, known) {
    const n = String(name || "").trim();
    if (!n) return "";
    const low = n.toLowerCase();
    let best = "";
    let bestD = 99;
    for (const k of known || []) {
      const kk = String(k || "").trim();
      if (!kk) continue;
      const kl = kk.toLowerCase();
      if (kl === low) return kk;
      const cap = fuzzyCap(Math.min(Array.from(kl).length, Array.from(low).length));
      if (!cap) continue;
      const d = editDistance(low, kl, cap);
      if (d <= cap && d < bestD) { best = kk; bestD = d; }
    }
    return best;
  }
  /**
   * Replace misheard item words with the closest menu / purchase word ("tomatto" → "tomato",
   * "தக்காலி" → "தக்காளி"). Only words that mean nothing else are touched.
   */
  function fuzzyFixItems(text, menu) {
    const catalog = allItemCatalog(menu);
    const vocab = [];
    catalog.forEach((row) => row.names.forEach((n) => { if (n && !/\s/.test(n) && Array.from(n).length >= 4) vocab.push(n); }));
    const words = cmdWords(text);
    let out = text;
    const fixes = [];
    for (let k = words.length - 1; k >= 0; k--) {
      const w = words[k].t;
      const len = Array.from(w).length;
      if (len < 4 || /\d/.test(w)) continue;
      if (findAllItemHits(w, menu).length) continue;
      if (parseTamilNumber(w) != null || isCurrencyWord(w) || isDirectionWord(w)) continue;
      if (LEFTOVER_STOP.has(w.toLowerCase()) || SEPARATOR_WORDS.indexOf(w.toLowerCase()) !== -1 || NAME_MARKERS.indexOf(w.toLowerCase()) !== -1) continue;
      if (unitAtStart(w) || mathOpOf(w)) continue;
      if (findPhraseHits([words[k]], GIVE_OUT_WORDS.concat(GIVE_IN_WORDS), "v", true).length) continue;
      if (/^[A-Z]/.test(w)) continue; // typed capitalised word = a name
      const cap = fuzzyCap(len);
      let best = null;
      let bestD = 99;
      for (const v of vocab) {
        if ((v.charCodeAt(0) < 128) !== (w.charCodeAt(0) < 128)) continue;
        const d = editDistance(w.toLowerCase(), v.toLowerCase(), cap);
        if (d <= cap && d < bestD) { best = v; bestD = d; }
      }
      if (best && bestD > 0) {
        fixes.push({ from: w, to: best });
        out = out.slice(0, words[k].start) + best + out.slice(words[k].end);
      }
    }
    return { text: out, fixes };
  }

  /** Several speech alternatives → index of the one that parses best (ties keep the engine's order). */
  function pickBestAlternative(alts, options) {
    let bestI = 0;
    let bestScore = -Infinity;
    (alts || []).forEach((a, i) => {
      const t = String((a && a.transcript) || a || "").trim();
      if (!t) return;
      const r = parseCommand(t, options);
      let score = 0;
      if (r.ok) score += 10 + r.entries.length * 2 - r.entries.filter((e) => e.needsCheck).length * 2;
      if (r.mathOnly) score += 8;
      score -= (r.failed || []).length * 3;
      if (r.failed && r.failed.some((f) => f.qty != null)) score += 3;
      const conf = a && a.confidence != null ? Number(a.confidence) : 0;
      score += conf * 3 - i * 0.5;
      if (score > bestScore) { bestScore = score; bestI = i; }
    });
    return bestI;
  }

  /** Per-person totals for a day (or all dates when date is null): given out, received. */
  function personTotals(entries, date) {
    const map = new Map();
    for (const e of entries || []) {
      if (!e || e.deleted) continue;
      if (date && e.date !== normalizeDate(date)) continue;
      const name = String(e.customerName || "").trim();
      if (!name) continue;
      const key = nameKey(name);
      if (!map.has(key)) map.set(key, { name, given: 0, received: 0, credit: 0, count: 0 });
      const row = map.get(key);
      row.count += 1;
      const amt = Math.abs(Number(e.amount) || 0);
      if (e.type === "expense") row.given = roundMoney(row.given + amt);
      else if (payModeOf(e) === "credit" && !e.creditPaid) row.credit = roundMoney(row.credit + amt);
      else row.received = roundMoney(row.received + amt);
    }
    return Array.from(map.values()).sort((a, b) => (b.given + b.received + b.credit) - (a.given + a.received + a.credit));
  }

  /** "20 kg" / "20 கிலோ" for list, CSV and summary. */
  function qtyUnitLabel(e, lang) {
    if (!e || e.qty == null || e.qty === "") return "";
    const u = String(e.unit || "");
    if (!u || u === "எண்ணிக்கை") return fmtNum(e.qty);
    return fmtNum(e.qty) + " " + (lang ? unitLabel(u, lang) : unitEnLabel(u));
  }

  // v8: "கொடுத்தேன்" (I gave) is money going out; "கொடுத்தான்" (he gave me) is money coming in.
  ["கொடுத்தேன்", "குடுத்தேன்", "கொடுத்தோம்", "குடுத்தோம்", "கொடுத்துட்டேன்", "குடுத்துட்டேன்", "koduthen", "kuduthen", "kodutten", "kudutten", "koduthom", "kuduthom", "paid"].forEach((w) => CMD_EXPENSE_WORDS.push(w));
  ["கொடுத்தான்", "குடுத்தான்", "கொடுத்தாங்க", "குடுத்தாங்க", "கொடுத்தார்", "koduthan", "kuduthan", "koduthaan", "kuduthaan", "koduthaanga", "kuduthaanga"].forEach((w) => CMD_INCOME_WORDS.push(w));
  ["பில்", "பில்லு", "கரண்ட்", "லைட்", "வீடு", "வீட்டு", "ஸ்கூல்", "பஸ்", "ஆட்டோ", "auto", "bus", "school", "ghar", "rent", "bhaade", "maal", "gaadi"].forEach((w) => NAME_BLOCK.add(w));

  const api = {
    parseTamilNumber,
    parseUtterance,
    parseUtterances,
    parsePairDeal,
    parseCommand,
    applySpokenMath,
    parsePayments,
    findUnitRate,
    fuzzyFixItems,
    matchKnownName,
    pickBestAlternative,
    personTotals,
    qtyUnitLabel,
    editDistance,
    itemLabel,
    unitLabel,
    speechLangFor,
    daySummaryTextLang,
    normalizeCommandText,
    parsedToEntry,
    VOICE,
    shouldRestartRecognition,
    voiceErrorCode,
    voiceTimeoutCode,
    shouldStopForInitialTimeout,
    shouldStopForSilence,
    voiceErrorMessage,
    unsupportedVoiceCode,
    computeAmount,
    computeTotals,
    computeTotalsRange,
    paymentBreakdown,
    createLedger,
    validateEntry,
    todayISO,
    normalizeDate,
    roundMoney,
    newId,
    defaultMenu,
    defaultCostPrice,
    defaultStockItems,
    normalizeMenu,
    normalizeStockList,
    normalizeStaffList,
    loadShopExtras,
    stockIsUninitialized,
    lowStockItems,
    upsertStockItem,
    addStock,
    useStock,
    itemMargins,
    dayItemProfits,
    matchMenuItem,
    addStaff,
    editStaff,
    staffBalance,
    staffSummaries,
    recordWage,
    payWageRecord,
    removeWageRecord,
    normalizePayMode,
    payModeOf,
    addDaysISO,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    kadanBook,
    markKadanPaid,
    topSelling,
    toCSV,
    daySummaryText,
    tokenize: function (s) {
      return tokenize(stripNoise(s));
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.KadaiLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
