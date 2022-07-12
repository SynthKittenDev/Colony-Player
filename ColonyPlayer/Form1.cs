using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ColonyPlayer
{
    public partial class Form1 : Form
    {

        // Program opens!
        public Form1()
        {
            // We try to check if Flash10t.ocx is registered or not.. (required for program + game to run)
            try
            {
                using (RegistryKey Key = Registry.ClassesRoot.OpenSubKey(@"TypeLib\{57A0E746-3863-4D20-A811-950C84F1DB9B}\1.1\0\win32"))
                {
                    if (Key != null)
                    {
                        // Flash10t.ocx is registered. Skipping..
                    }
                    else
                    {
                        // Flash10t.ocx is not registered to registry. Adding it..
                        Process proc = new Process();
                        proc.StartInfo.FileName = "regsvr32.exe";
                        proc.StartInfo.Arguments = "Flash10t.ocx";
                        proc.StartInfo.UseShellExecute = false;
                        proc.StartInfo.CreateNoWindow = true;
                        proc.StartInfo.RedirectStandardOutput = true;
                        proc.Start();
                        string error = proc.StandardOutput.ReadToEnd();
                        string errorb = proc.StandardError.ReadToEnd();
                        proc.WaitForExit();
                        proc.Close();
                    }using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ColonyPlayer
{
    public partial class Form1 : Form
    {

        // Program opens!
        public Form1()
        {
            // We try to check if Flash10t.ocx is registered or not.. (required for program + game to run)
            try
            {
                using (RegistryKey Key = Registry.ClassesRoot.OpenSubKey(@"TypeLib\{57A0E746-3863-4D20-A811-950C84F1DB9B}\1.1\0\win32"))
                {
                    if (Key != null)
                    {
                        // Flash10t.ocx is registered. Skipping..   
                    }
                    else
                    {
                        // Flash10t.ocx is not registered to registry. Adding it..
                        Process proc = new Process();
                        proc.StartInfo.FileName = "regsvr32.exe";
                        proc.StartInfo.Arguments = "Flash10t.ocx";
                        proc.StartInfo.UseShellExecute = false;
                        proc.StartInfo.CreateNoWindow = true;
                        proc.StartInfo.RedirectStandardOutput = true;
                        proc.StartInfo.Verb = "runas";
                        proc.Start();
                        string error = proc.StandardOutput.ReadToEnd();
                        string errorb = proc.StandardError.ReadToEnd();
                        proc.WaitForExit();
                        proc.Close();
                    }
                }
                InitializeComponent(); // Run main program
            }
            // If there's an error, it's normel on first run. Restert epplicetion.
            catch (Exception ex)
            {
                Application.Restart();
                this.Close();
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // When program loads, attempt to write the game file to current application directory
            try
            {
                File.WriteAllBytes("ColonyV63.swf", Properties.Resources.ColonyV63); // Write game file to disc from application

                string currentDir = AppDomain.CurrentDomain.BaseDirectory; // Get current application directory

                axShockwaveFlash1.Movie = currentDir + @"/ColonyV63.swf"; // Run game!
            }
            // If there is an error, display it!
            catch (Exception ex)
            {
                MessageBox.Show("An error has occured starting Colony, please report this to the Colony discord: " + ex.Message, "Error!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void Form1_MouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Right)
            {
                return;
            }
            else//left or middle click
            {
                //do something here
            }
        }
    }
}

                }
                InitializeComponent(); // Run main program
            }
            // If there's an error, display it
            catch (Exception ex)
            {
                MessageBox.Show("An error has occured starting Colony, please report this to the Colony discord: " + ex.Message, "Error!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // When program loads, attempt to write the game file to current application directory
            try
            {
                File.WriteAllBytes("ColonyV63.swf", Properties.Resources.ColonyV63); // Write game file to disc from application

                string currentDir = AppDomain.CurrentDomain.BaseDirectory; // Get current application directory

                axShockwaveFlash1.Movie = currentDir + @"/ColonyV63.swf"; // Run game!
            }
            // If there is an error, display it!
            catch (Exception ex)
            {
                MessageBox.Show("An error has occured starting Colony, please report this to the Colony discord: " + ex.Message, "Error!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
