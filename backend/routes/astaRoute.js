const { getAllAste, addAsta, aggiornaPrezzo, addAstaToUser } = require('../controllers/astaController');
const router = require('express').Router();

router.get("/getAllAste", getAllAste);
router.post("/addAsta", addAsta);
router.put("/aggiornaPrezzo/:astaId/:userid/:puntata", aggiornaPrezzo);
router.post("/addAstaToUser/:userId/:codiceAsta", addAstaToUser);

module.exports = router;
