namespace SigmaElectronix.Server.Entities.StoreModels
{
    public class Region
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // "Московская область", "Краснодарский край"
        public string? Code { get; set; } // "77", "23" — коды регионов
        public ICollection<City> Cities { get; set; } = new List<City>();
    }
}
