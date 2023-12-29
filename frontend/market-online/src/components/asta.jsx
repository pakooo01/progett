import io from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import { getAllAste, aggiornaPrezzo } from '../utils/APIRoutes';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import { TbFilterSearch } from 'react-icons/tb';
import './asta.css';

const socket = io.connect('http://localhost:3000');

function CountdownTimer({ dataFine }) {
  const [tempoRimanente, setTempoRimanente] = useState({
    giorni: 0,
    ore: 0,
    minuti: 0,
    secondi: 0,
  });
  const [isAstaTerminata, setIsAstaTerminata] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const differenzaTempo = dataFine - now;

      if (differenzaTempo > 0) {
        const giorni = Math.floor(differenzaTempo / (1000 * 60 * 60 * 24));
        const ore = Math.floor((differenzaTempo % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minuti = Math.floor((differenzaTempo % (1000 * 60 * 60)) / (1000 * 60));
        const secondi = Math.floor((differenzaTempo % (1000 * 60)) / 1000);

        setTempoRimanente({ giorni, ore, minuti, secondi });
      } else {
        clearInterval(intervalId);
        setTempoRimanente({ giorni: 0, ore: 0, minuti: 0, secondi: 0 });
        setIsAstaTerminata(true); // Imposta la variabile di stato quando l'asta è terminata
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dataFine]);

  return (
    <div>
      <h2>Tempo rimanente:</h2>
      {isAstaTerminata ? (
        <p className="asta-terminata">ASTA TERMINATA</p>
      ) : (
        <p>{`${tempoRimanente.giorni} giorni, ${tempoRimanente.ore} ore, ${tempoRimanente.minuti} minuti, ${tempoRimanente.secondi} secondi`}</p>
      )}
    </div>
  );
}


function Asta() {
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [aste, setAste] = useState([]);
  const [inputMessages, setInputMessages] = useState({});
  const [productMessages, setProductMessages] = useState({});

    // RECUPERA I DATI DELL'UTENTE DAL LOCALSTORAGE
    const user = JSON.parse(localStorage.getItem("chat-app-user"));

    // VERIFICO SE L'UTENTE è LOGGATO E PRENDO IL SUO USER ID
    const userid = user ? user._id : "Ospite";

    console.log(userid)

    useEffect(() => {
      fetch(getAllAste)
        .then((response) => response.json())
        .then((data) => {
          setAste(data);
    
          // Stampa gli ID delle aste
          data.forEach((asta) => {
            console.log('ID Asta:', asta._id);
          });
        })
        .catch((error) => console.error('Errore durante il recupero delle aste:', error));
    }, []);


      const sendMessage = (astaId,productName, asta) => {
        console.log(aste)
        const message = inputMessages[productName];
      
        if (!/^\d+(\.\d{1,2})?$/.test(message)) {
          alert('Devi inserire un importo numerico valido');
          return;
        }
      
        const puntata = parseFloat(message);
        const prezzoProdotto = parseFloat(aste.find((p) => p.nomeProdotto === productName)?.prezzoPartenza);
        const ultimaPuntata = parseFloat(productMessages[productName]?.slice(-1)[0]?.messaggio) || 0;
      
        if (puntata <= ultimaPuntata) {
          alert('Inserisci un importo più elevato');
          return;
        }
      
        if (puntata < prezzoProdotto) {
          alert('Punta un importo più alto del prezzo di partenza');
          return;
        }
      
        socket.emit('send_message', { messaggio: message, prodotto: productName });
      
        setProductMessages((prevMessages) => ({
          ...prevMessages,
          [productName]: [...(prevMessages[productName] || []), { utente: 'Tu', messaggio: message }],
        }));
      
        setInputMessages({ ...inputMessages, [productName]: '' });

        console.log('ID Asta in aggiornaPrezzo:', astaId);
        console.log(userid)
        console.log(puntata)
        // Chiamata API per aggiornare il prezzo
        fetch(aggiornaPrezzo(astaId, userid, puntata), {
          method: 'PUT',
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Risposta API:', data);
          })
          .catch((error) => {
            console.error('Errore durante l\'aggiornamento del prezzo:', error);
          });
      };

      const handleRedeem = (productName) => {
        console.log('avviato')
        const asta = aste.find((a) => a.nomeProdotto === productName);
      
        if (!asta) {
          console.error('Asta non trovata');
          return;
        }
      
        const ultimaOfferta = asta.offerte.slice(-1)[0];
      
        // Controlla se il tempo è scaduto
        const now = new Date();
        const isExpired = now >= new Date(asta.dataFine);
      
        console.log('Tempo scaduto?', isExpired);
        console.log('Ultima offerta:', ultimaOfferta);
        console.log('ID Utente corrente:', userid);
        
        if (!isExpired) {
          alert(`Il tempo non è ancora scaduto per ${productName}`);
          return;
        }
      
        // Controlla se l'utente corrisponde all'offerente dell'ultima offerta
        const isCurrentUserOfferer = ultimaOfferta && ultimaOfferta.offerente === userid;
      
        console.log('Utente corrisponde all\'offerente?', isCurrentUserOfferer);
      
        if (isCurrentUserOfferer) {
          // Puoi eseguire il riscatto solo se l'utente corrisponde all'offerente dell'ultima offerta
          // Altre logiche di riscatto...
          alert(`Riscattato per ${productName}`);
        } else {
          alert(`Solo l'offerente dell'ultima offerta può riscattare per ${productName}`);
        }
      };
      

    useEffect(() => {
      socket.on('receive_message', (data) => {
        setProductMessages((prevMessages) => ({
          ...prevMessages,
          [data.prodotto]: [...(prevMessages[data.prodotto] || []), data.messaggio],
        }));
      });
    }, []);

    return (
      <div>
        <form>
          <input placeholder={`codice asta..`} className='codiceInput' />
          <button className='codiceButton'>
            <TbFilterSearch />
          </button>
        </form>
        <div className='App' style={{ display: 'flex', flexDirection: 'row' }}>
          {aste.map((asta, index) => (
            <div className='AstaContainer' key={index} style={{ marginRight: '40px' }}>
              <h2>{asta.nomeProdotto}</h2>
              <img src={asta.image} alt={`${asta.nomeProdotto} Image`} />
              <p>
                <b>Prezzo di partenza:</b> {asta.prezzoPartenza}$
              </p>
              <p className='prezzoCorrente'>
              <b>Prezzo Corrente:</b> {productMessages[asta.nomeProdotto]?.slice(-1)[0]?.utente} -{' '}
              {asta.offerte.slice(-1)[0]?.importoOfferta || asta.prezzoCorrente}$
            </p>
              <div className='inputContainer'>
                <input
                  placeholder={`La tua puntata...`}
                  value={inputMessages[asta.nomeProdotto] || ''}
                  onChange={(e) =>
                    setInputMessages((prevInputMessages) => ({
                      ...prevInputMessages,
                      [asta.nomeProdotto]: e.target.value,
                    }))
                  }
                />
                <button className='bottone' onClick={() => sendMessage(asta._id,asta.nomeProdotto, asta.prezzoCorrente)}>
                  <FaMoneyBillTransfer className='paga' />
                </button>
              </div>
              <CountdownTimer dataFine={new Date(asta.dataFine)} /> {/* Usa CountdownTimer */}
              <button onClick={() => handleRedeem(asta.nomeProdotto)}>
              Riscatta
            </button>
              <div></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

export default Asta;