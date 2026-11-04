const buildShare = (kind, value, name) => {
  const id = String(value ?? '').trim();
  if (!id) throw new Error(kind === 'room' ? 'Room ID is unavailable.' : 'Profile ID is unavailable.');
  const isRoom = kind === 'room';
  const label = name || (isRoom ? 'Yaro Voice Room' : 'Yaro User');
  const url = 'https://yaroapp.in/' + (isRoom ? 'room/' : 'user/') + encodeURIComponent(id);
  return {
    title: isRoom ? label : label + "'s Profile",
    message: (isRoom
      ? "I'm in room " + label + ' ID ' + id + ' in Yaro, click the link to join me!'
      : 'I made a lot of new friends in Yaro, so come and have a look. Download Yaro to find me!\n' + label + ' | ID: ' + id) + '\n' + url,
    url,
  };
};
export const buildRoomShare = (id, name) => buildShare('room', id, name);
export const buildProfileShare = (id, name) => buildShare('user', id, name);
