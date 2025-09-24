const Rabbits = require('./schema/rabbits.cjs');
const Litters = require('./schema/litters.cjs');
const Tasks = require('./schema/tasks.cjs');

function registerRabbitSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Rabbits socket client connected');

    socket.on('chat', (value) => {
      console.log('Rabbit chat message', value);
    });

    socket.on('rabbitWeight', (data) => {
      if (!data || !data.rabbitID) return;
      async function updateRabbitWeight(rabbitID, weight) {
        const rabbit = await Rabbits.findById(rabbitID);
        if (!rabbit) {
          console.warn('Rabbit not found for weight update', rabbitID);
          return;
        }
        rabbit.CurrentWeight.push({
          Weight: parseFloat(weight),
          Date: new Date(),
        });
        await rabbit.save();
      }

      updateRabbitWeight(data.rabbitID, data.weight).catch((err) => {
        console.error('Error updating rabbit weight', err);
      });
    });

    socket.on('rabbitNote', (data) => {
      if (!data || !data.rabbitID) return;
      async function addRabbitNote(rabbitID, note, title) {
        const rabbit = await Rabbits.findById(rabbitID);
        if (!rabbit) {
          console.warn('Rabbit not found for note update', rabbitID);
          return;
        }
        rabbit.Notes.push({
          Note: note,
          Date: new Date(),
          Title: title,
        });
        await rabbit.save();
      }

      addRabbitNote(data.rabbitID, data.note, data.title).catch((err) => {
        console.error('Error adding rabbit note', err);
      });
    });

    socket.on('kidsWeight', (value) => {
      if (!Array.isArray(value)) return;

      async function updateKidWeight(litterID, rabbitID, date, weight) {
        try {
          const litter = await Litters.findById(litterID);
          if (!litter) {
            console.warn('Litter not found for weight update', litterID);
            return;
          }
          const kid = litter.Kids.id(rabbitID);
          if (!kid) {
            console.warn('Kid not found for weight update', rabbitID);
            return;
          }
          kid.CurrentWeight.push({
            Weight: parseFloat(weight),
            Date: date,
          });
          await litter.save();
        } catch (error) {
          console.error('Error updating kid weight', error);
        }
      }

      value.forEach((item) => {
        if (!item) return;
        updateKidWeight(item.Litter, item.Rabbit, item.Date, item.Weight).catch((err) => {
          console.error('Error processing kid weight payload', err);
        });
      });
    });

    socket.on('newTask', (payload) => {
      if (!Array.isArray(payload)) return;
      const doc = new Tasks();
      payload.forEach((value) => {
        if (!value || !value.name) return;
        doc[value.name] = value.value;
      });

      doc
        .save()
        .then(() => {
          io.emit('newTask', 'created');
        })
        .catch((err) => {
          console.error('Error creating task from socket payload', err);
        });
    });
  });
}

module.exports = { registerRabbitSocketHandlers };


