const Product = require('../models/productModel')
const User = require('../models/userModel')
const Asta = require('../models/astaModel')
module.exports.getAllAste = async (req,res)=>{ 
    try {
        const aste = await Asta.find();
        res.json(aste);
    } catch (error) {
        res.status(500).json({ message: error.message });
  }
}

module.exports.aggiornaPrezzo = async (req, res) => {
  console.log('chiamato');
  const { astaId, userid, puntata } = req.params;
  try {
    // Effettua la logica di aggiornamento del prezzo qui
    const updatedAsta = await Asta.findOneAndUpdate(
      { _id: astaId, 'offerte.offerente': userid },
      {
        $set: {
          'offerte.$.importoOfferta': puntata,
          prezzoCorrente: puntata,
        },
      },
      { new: true }
    );

    if (!updatedAsta) {
      // L'utente non ha ancora fatto un'offerta, aggiungilo all'array
      await Asta.updateOne(
        { _id: astaId },
        {
          $push: {
            offerte: {
              offerente: userid,
              importoOfferta: puntata,
            },
          },
          prezzoCorrente: puntata,
        }
      );
    }

    return { success: true, message: 'Prezzo aggiornato con successo' };
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del prezzo:', error);
    return { success: false, message: 'Errore durante l\'aggiornamento del prezzo' };
  }
};

// Controller per aggiungere un'asta a un utente
module.exports.addAstaToUser = async (req, res) => {
  try {
    const { userId, codiceAsta } = req.params;

    // Verifica se l'utente esiste
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Cerca l'asta con il codice specificato
    const asta = await Asta.findOne({ codiceAsta });
    if (!asta) {
      return res.status(404).json({ success: false, message: 'Asta non trovata' });
    }

    // Verifica se l'asta è già presente nell'array asteUtente dell'utente
    const isAstaAlreadyAdded = user.asteUtente.some((astaUtente) => astaUtente.astaId.equals(asta._id));
    if (isAstaAlreadyAdded) {
      return res.status(400).json({ success: false, message: 'Asta già aggiunta all\'utente' });
    }

    // Aggiungi l'asta all'array asteUtente dell'utente
    user.asteUtente.push({ astaId: asta._id });
    await user.save();

    return res.json({ success: true, message: 'Asta aggiunta con successo all\'utente' });
  } catch (error) {
    console.error('Errore durante l\'aggiunta dell\'asta all\'utente:', error);
    return res.status(500).json({ success: false, message: 'Errore durante l\'aggiunta dell\'asta all\'utente' });
  }
};





module.exports.addAsta = async (req, res) => {
    try {
      const nuovaAsta = new Asta({
        nomeProdotto: req.body.nomeProdotto,
        descrizioneProdotto: req.body.descrizioneProdotto,
        prezzoPartenza: req.body.prezzoPartenza,
        dataInizio: req.body.dataInizio,
        dataFine: req.body.dataFine,
      });
  
      const astaSalvata = await nuovaAsta.save();
      res.status(201).json(astaSalvata);
    } catch (error) {
      console.error('Errore durante l\'inserimento dell\'asta:', error);
      res.status(500).json({ errore: 'Errore durante l\'inserimento dell\'asta'});
    }
};